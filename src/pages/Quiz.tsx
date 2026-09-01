import {
  Check,
  ClipboardCheck,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAllQuestions, loadExplanations } from "../data/questions";
import {
  getQuestionProgress,
  recordDirectAnswer,
  saveQuizResult,
  toggleBookmark,
} from "../lib/db";
import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import type { Exam, QuizAnswer } from "../types";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

const SECONDS_PER_QUESTION = 60;
const HALF_TIME = SECONDS_PER_QUESTION / 2;
const LAST_TEN_SECONDS = 10;

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
      if (topic !== "all") {
        questions = questions.filter((q) => q.topicId === topic);
      }
    }

    return shuffle(questions).slice(0, 40);
  }, [examId, mode, ids.join(","), subjectId, topic]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [feedback, setFeedback] = useState("");
  const [startedAt] = useState(new Date().toISOString());

  // Refs keep the timer callback synchronized with the latest answer state.
  const selectedRef = useRef<number | null>(null);
  const answersRef = useRef<QuizAnswer[]>([]);
  const submittedRef = useRef(false);

  const question = pool[index];

  const explanation = question
    ? loadExplanations(examId, question.subjectId).find(
        (x) => x.id === question.id
      )
    : undefined;

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  // Keep the quiz in an exam-like mode: no in-app exit/back action and
  // browser back does not leave the active quiz accidentally.
  useEffect(() => {
    if (!question) return;

    const state = { mediquiz: true };
    window.history.pushState(state, "", window.location.href);

    const preventBack = () => {
      window.history.pushState(state, "", window.location.href);
    };

    window.addEventListener("popstate", preventBack);

    return () => {
      window.removeEventListener("popstate", preventBack);
    };
  }, [question?.id]);

  useEffect(() => {
    if (!question) return;

    getQuestionProgress(question.id).then((p) =>
      setBookmarked(Boolean(p?.bookmarked))
    );

    selectedRef.current = null;
    submittedRef.current = false;

    setSelected(null);
    setSubmitted(false);
    setFeedback("");
    setSecondsLeft(SECONDS_PER_QUESTION);
  }, [question?.id]);

  async function submitCurrent(
    choice: number | null = selectedRef.current,
    timedOut = false
  ) {
    if (submittedRef.current || !question) return;

    const correct = choice !== null && choice === question.answer;
    const nextAnswers = [
      ...answersRef.current,
      { qid: question.id, selected: choice, correct },
    ];

    answersRef.current = nextAnswers;
    submittedRef.current = true;

    setAnswers(nextAnswers);
    setSubmitted(true);
    setFeedback("");

    if (mode === "direct") {
      await recordDirectAnswer(question.id, correct);
    }

    if (timedOut) {
      setSecondsLeft(0);
    }
  }

  // One fixed 60-second countdown for every question.
  useEffect(() => {
    if (!question || submitted) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          void submitCurrent(selectedRef.current, true);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [question?.id, submitted]);

  if (!pool.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold">No questions available</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add verified PYQs to this section first.
        </p>
        <Link
          to={`/pyqs/${exam}`}
          className="mt-5 inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Back to PYQs
        </Link>
      </main>
    );
  }

  const finish = async (finalAnswers = answersRef.current) => {
    await saveQuizResult({
      exam: examId,
      questionIds: pool.map((q) => q.id),
      answers: finalAnswers,
      customModule: mode === "custom",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    navigate(`/result/${examId}`, {
      state: {
        total: pool.length,
        answers: finalAnswers,
        custom: mode === "custom",
      },
    });
  };

  const next = async () => {
    if (!submittedRef.current) return;

    if (index === pool.length - 1) {
      await finish(answersRef.current);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSubmitClick = () => {
    if (submittedRef.current) return;

    // Before half-time, do not submit. Give a small, non-disruptive cue.
    if (secondsLeft > HALF_TIME) {
      setFeedback("Submit becomes available after half the time.");
      window.setTimeout(() => setFeedback(""), 1800);
      return;
    }

    void submitCurrent();
  };

  const handleSubmitDoubleClick = () => {
    // Double-tap/double-click is also accepted after half-time.
    if (!submittedRef.current && secondsLeft <= HALF_TIME) {
      void submitCurrent();
    }
  };

  const bookmark = async () => {
    if (!question) return;
    const nextBookmark = await toggleBookmark(question.id);
    setBookmarked(nextBookmark.bookmarked);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // The thin line now represents the current question's remaining time.
  const timerProgress = Math.max(
    0,
    Math.min(100, (secondsLeft / SECONDS_PER_QUESTION) * 100)
  );
  const danger = secondsLeft <= LAST_TEN_SECONDS && !submitted;

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-3xl select-none px-4 py-5 sm:py-8">
      {/* Exam-mode header: no Exit and no pause/timer control. */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
            danger
              ? "border-red-900/70 bg-red-950/30 text-red-400"
              : "border-slate-800 text-slate-400"
          }`}
          aria-label={`Time remaining ${mm}:${ss}`}
        >
          <Clock size={14} />
          {mm}:{ss}
        </div>

        <span className="text-xs text-slate-500">
          {index + 1}/{pool.length}
        </span>

        <span className="hidden text-xs text-slate-600 sm:inline">
          {mode === "custom" ? "Custom" : "QBank"}
        </span>
      </div>

      {/* Current-question timer line. Last 10 seconds turn red. */}
      <div
        className={`mb-4 h-1.5 overflow-hidden rounded-full ${
          danger ? "bg-red-950/60" : "bg-slate-900"
        }`}
        aria-label="Question time remaining"
      >
        <div
          className={`h-full transition-all duration-1000 ${
            danger ? "bg-red-500" : "bg-slate-400"
          }`}
          style={{ width: `${timerProgress}%` }}
        />
      </div>

      <QuestionCard
        question={question}
        explanation={explanation}
        selected={selected}
        submitted={submitted}
        bookmarked={bookmarked}
        onSelect={(choice) => {
          if (submittedRef.current) return;
          setSelected(choice);
          selectedRef.current = choice;
          setFeedback("");
        }}
        onBookmark={bookmark}
      />

      {/* Small feedback for an early submit attempt. */}
      <div className="mt-3 min-h-5 text-center text-xs text-slate-500">
        {feedback}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {/* Back/previous question is intentionally removed in exam mode. */}

        {!submitted ? (
          <button
            type="button"
            disabled={selected === null}
            onClick={handleSubmitClick}
            onDoubleClick={handleSubmitDoubleClick}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-950 opacity-45 transition-opacity disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="Submit answer for this question"
          >
            SUBMIT
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void next()}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-950"
            aria-label={
              index === pool.length - 1
                ? "Submit complete exam"
                : "Go to next question"
            }
          >
            {index === pool.length - 1 ? (
              <span className="flex items-center justify-center">
                <ClipboardCheck size={24} strokeWidth={2.2} />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                NEXT <ChevronRight size={18} />
              </span>
            )}
          </button>
        )}
      </div>

      {submitted && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Check size={14} />
          Answer recorded
          {mode === "custom" &&
            " — custom modules do not alter correctness statistics"}
        </div>
      )}
    </main>
  );
}
