import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, Flag, Pause, Play } from "lucide-react";
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

export default function Quiz() {
  const { exam, subjectId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const examId = exam as Exam;
  const mode = search.get("mode") === "custom" ? "custom" : "direct";
  const ids = (search.get("ids") ?? "").split(",").filter(Boolean);
  const topic = search.get("topic") ?? "all";

  const pool = useMemo(() => {
    let questions = getAllQuestions(examId);

    if (mode === "custom") {
      questions = questions.filter((q) => ids.includes(q.id));
    } else if (subjectId && subjectId !== "custom") {
      questions = questions.filter((q) => q.subjectId === subjectId);
      if (topic !== "all") questions = questions.filter((q) => q.topicId === topic);
    }

    return shuffle(questions).slice(0, 40);
  }, [examId, mode, ids.join(","), subjectId, topic]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [startedAt] = useState(new Date().toISOString());

  const question = pool[index];
  const explanation = question
    ? loadExplanations(examId, question.subjectId).find((x) => x.id === question.id)
    : undefined;

  useEffect(() => {
    if (!question) return;
    getQuestionProgress(question.id).then((p) => setBookmarked(Boolean(p?.bookmarked)));
    setSelected(null);
    setSubmitted(false);
    setSecondsLeft(SECONDS_PER_QUESTION);
  }, [question?.id]);

  useEffect(() => {
    if (!timerEnabled || submitted || !question) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          void submitCurrent(null, true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerEnabled, submitted, question?.id]);

  if (!pool.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold">No questions available</h1>
        <p className="mt-2 text-sm text-slate-500">Add verified PYQs to this section first.</p>
        <Link to={`/pyqs/${exam}`} className="mt-5 inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950">
          Back to PYQs
        </Link>
      </main>
    );
  }

  const finish = async (finalAnswers = answers) => {
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
    const nextAnswers = [...answers, { qid: question.id, selected: choice, correct }];
    setAnswers(nextAnswers);
    setSubmitted(true);

    if (mode === "direct") {
      await recordDirectAnswer(question.id, correct);
    }

    if (timedOut) {
      setSecondsLeft(0);
    }
  }

  const next = async () => {
    if (!submitted) return;
    if (index === pool.length - 1) await finish(answers);
    else setIndex((i) => i + 1);
  };

  const bookmark = async () => {
    if (!question) return;
    const next = await toggleBookmark(question.id);
    setBookmarked(next.bookmarked);
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
            onClick={() => setTimerEnabled((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-2 text-xs text-slate-400 hover:bg-slate-900"
          >
            {timerEnabled ? <Pause size={13} /> : <Play size={13} />}
            {timerEnabled ? `${mm}:${ss}` : "Timer off"}
          </button>
          <span className="text-xs text-slate-500">{index + 1}/{pool.length}</span>
          <span className="hidden text-xs text-slate-600 sm:inline">{mode === "custom" ? "Custom" : "QBank"}</span>
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
        onSelect={setSelected}
        onBookmark={bookmark}
      />

      <div className="mt-4 flex items-center gap-2">
        <button
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="rounded-xl border border-slate-800 p-3 text-slate-400 disabled:opacity-25"
        >
          <ChevronLeft size={18} />
        </button>

        {!submitted ? (
          <button
            disabled={selected === null}
            onClick={() => void submitCurrent()}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-30"
          >
            SUBMIT
          </button>
        ) : (
          <button onClick={() => void next()} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950">
            {index === pool.length - 1 ? "FINISH" : "NEXT"}
          </button>
        )}

        <button
          disabled={!submitted}
          onClick={() => void next()}
          className="rounded-xl border border-slate-800 p-3 text-slate-400 disabled:opacity-25"
        >
          {index === pool.length - 1 ? <Flag size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {submitted && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Check size={14} /> Answer recorded
          {mode === "custom" && " — custom modules do not alter correctness statistics"}
        </div>
      )}
    </main>
  );
}
