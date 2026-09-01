import { ArrowLeft, ChevronLeft, ChevronRight, Flag, Pause, Play } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAllQuestions, loadExplanations } from "../data/questions";
import { getQuestionProgress, recordDirectAnswer, saveQuizResult, toggleBookmark } from "../lib/db";
import { useEffect, useMemo, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import type { Exam, QuizAnswer } from "../types";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

const SECONDS_PER_QUESTION = 60;

type AnswerMap = Record<string, number | null>;
type BooleanMap = Record<string, boolean>;
type NumberMap = Record<string, number>;

export default function Quiz() {
  const { exam, subjectId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const examId = exam as Exam;
  const mode = search.get("mode") === "custom" ? "custom" : "direct";
  const ids = (search.get("ids") ?? "").split(",").filter(Boolean);
  const topic = search.get("topic") ?? "all";
  const count = Number(search.get("count") ?? "40");

  const pool = useMemo(() => {
    let questions = getAllQuestions(examId);

    if (mode === "custom") {
      const idSet = new Set(ids);
      questions = questions.filter((q) => idSet.has(q.id));
    } else if (subjectId && subjectId !== "custom") {
      questions = questions.filter((q) => q.subjectId === subjectId);
      if (topic !== "all") questions = questions.filter((q) => q.topicId === topic);
    }

    return shuffle(questions).slice(0, Number.isFinite(count) && count > 0 ? count : 40);
  }, [examId, mode, ids.join(","), subjectId, topic, count]);

  const [index, setIndex] = useState(0);
  const [selectedByQuestion, setSelectedByQuestion] = useState<AnswerMap>({});
  const [submittedByQuestion, setSubmittedByQuestion] = useState<BooleanMap>({});
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [bookmarkedByQuestion, setBookmarkedByQuestion] = useState<BooleanMap>({});
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [secondsByQuestion, setSecondsByQuestion] = useState<NumberMap>({});
  const [startedAt] = useState(new Date().toISOString());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [lastSubmitTap, setLastSubmitTap] = useState(0);
  const [finishNotice, setFinishNotice] = useState(false);

  const question = pool[index];
  const selected = question ? (selectedByQuestion[question.id] ?? null) : null;
  const submitted = question ? Boolean(submittedByQuestion[question.id]) : false;
  const bookmarked = question ? Boolean(bookmarkedByQuestion[question.id]) : false;
  const secondsLeft = question ? (secondsByQuestion[question.id] ?? SECONDS_PER_QUESTION) : SECONDS_PER_QUESTION;

  const explanation = question
    ? loadExplanations(examId, question.subjectId).find((x) => x.id === question.id)
    : undefined;

  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    getQuestionProgress(question.id).then((p) => {
      if (cancelled) return;
      setBookmarkedByQuestion((current) => ({ ...current, [question.id]: Boolean(p?.bookmarked) }));
      setSecondsByQuestion((current) => ({
        ...current,
        [question.id]: current[question.id] ?? SECONDS_PER_QUESTION
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [question?.id]);

  useEffect(() => {
    if (!timerEnabled || submitted || !question) return;
    const timer = window.setInterval(() => {
      setSecondsByQuestion((current) => {
        const currentValue = current[question.id] ?? SECONDS_PER_QUESTION;
        if (currentValue <= 1) {
          window.clearInterval(timer);
          void submitCurrent(null, true);
          return { ...current, [question.id]: 0 };
        }
        return { ...current, [question.id]: currentValue - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerEnabled, submitted, question?.id]);

  if (!pool.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold">No questions available</h1>
        <p className="mt-2 text-sm text-slate-500">No questions match the selected module criteria.</p>
        <Link to={`/pyqs/${exam}`} className="mt-5 inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950">
          Back to PYQs
        </Link>
      </main>
    );
  }

  const finish = async () => {
    const finalAnswers = pool
      .map((q) => answers.find((a) => a.qid === q.id))
      .filter((a): a is QuizAnswer => Boolean(a));

    await saveQuizResult({
      exam: examId,
      questionIds: pool.map((q) => q.id),
      answers: finalAnswers,
      customModule: mode === "custom",
      startedAt,
      finishedAt: new Date().toISOString()
    });

    navigate(`/result/${examId}`, {
      state: {
        total: pool.length,
        answers: finalAnswers,
        custom: mode === "custom"
      }
    });
  };

  async function submitCurrent(choice: number | null = selected, timedOut = false) {
    if (submitted || !question) return;

    const correct = choice !== null && choice === question.answer;
    const nextAnswer: QuizAnswer = { qid: question.id, selected: choice, correct };

    setSelectedByQuestion((current) => ({ ...current, [question.id]: choice }));
    setAnswers((current) => {
      const withoutCurrent = current.filter((a) => a.qid !== question.id);
      return [...withoutCurrent, nextAnswer];
    });
    setSubmittedByQuestion((current) => ({ ...current, [question.id]: true }));

    if (mode === "direct" && choice !== null) {
      await recordDirectAnswer(question.id, correct);
    }

    if (timedOut) {
      setSecondsByQuestion((current) => ({ ...current, [question.id]: 0 }));
    }
  }

  const goPrevious = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    if (!submitted || index >= pool.length - 1) return;
    setIndex((i) => i + 1);
  };

  const handleFinalSubmit = () => {
    const now = Date.now();
    if (now - lastSubmitTap < 500) {
      setLastSubmitTap(0);
      setFinishNotice(false);
      setConfirmFinish(true);
      return;
    }
    setLastSubmitTap(now);
    setFinishNotice(true);
    window.setTimeout(() => setFinishNotice(false), 700);
  };

  const bookmark = async () => {
    if (!question || !submitted) return;
    const next = await toggleBookmark(question.id);
    setBookmarkedByQuestion((current) => ({ ...current, [question.id]: next.bookmarked }));
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to={`/pyqs/${exam}`} className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200">
          <ArrowLeft size={15} /> Exit
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTimerEnabled((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-2 text-xs text-slate-400 hover:bg-slate-900"
          >
            {timerEnabled ? <Pause size={13} /> : <Play size={13} />}
            {timerEnabled ? `${mm}:${ss}` : "Timer off"}
          </button>
          <span className="text-xs text-slate-500">{index + 1}/{pool.length}</span>
        </div>
      </div>

      <div className="mb-4 h-1 overflow-hidden rounded-full bg-slate-900">
        <div className="h-full bg-slate-400 transition-all" style={{ width: `${((index + 1) / pool.length) * 100}%` }} />
      </div>

      <QuestionCard
        question={question}
        explanation={explanation}
        selected={selected}
        submitted={submitted}
        bookmarked={bookmarked}
        onSelect={(choice) => {
          if (!submitted) setSelectedByQuestion((current) => ({ ...current, [question.id]: choice }));
        }}
        onBookmark={() => void bookmark()}
        minimalBeforeSubmit={mode === "custom"}
      />

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={goPrevious}
          className="rounded-xl border border-slate-800 p-3 text-slate-400 disabled:opacity-25"
          aria-label="Previous question"
        >
          <ChevronLeft size={18} />
        </button>

        {mode === "custom" ? (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950"
          >
            SUBMIT
          </button>
        ) : (
          <button
            type="button"
            disabled={selected === null || submitted}
            onClick={() => void submitCurrent()}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-30"
          >
            SUBMIT
          </button>
        )}

        {mode === "custom" ? (
          <button
            type="button"
            disabled={!submitted || index === pool.length - 1}
            onClick={goNext}
            className="rounded-xl border border-slate-800 p-3 text-slate-400 disabled:opacity-25"
            aria-label="Next question"
          >
            {index === pool.length - 1 ? <Flag size={18} /> : <ChevronRight size={18} />}
          </button>
        ) : (
          <button
            type="button"
            disabled={!submitted}
            onClick={() => {
              if (index === pool.length - 1) void finish();
              else goNext();
            }}
            className="rounded-xl border border-slate-800 p-3 text-slate-400 disabled:opacity-25"
            aria-label={index === pool.length - 1 ? "Finish quiz" : "Next question"}
          >
            {index === pool.length - 1 ? <Flag size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
      </div>

      {finishNotice && (
        <div className="mt-3 text-center text-xs text-slate-500">Double-tap SUBMIT to finish the module.</div>
      )}

      {confirmFinish && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-800 p-2 text-slate-300">
                <Flag size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-100">Are you sure?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  You are about to submit this module. Any unanswered questions will remain unanswered.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmFinish(false)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => void finish()}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950"
              >
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
