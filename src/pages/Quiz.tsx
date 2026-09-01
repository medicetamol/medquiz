import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Pause, Play } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAllQuestions, loadExplanations } from "../data/questions";
import { getQuestionProgress, recordDirectAnswer, saveQuizResult, toggleBookmark } from "../lib/db";
import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import type { Exam, QuizAnswer } from "../types";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

const SECONDS_PER_QUESTION = 60;
const HALF_TIME = 30;
const LAST_TEN_SECONDS = 10;
const DOUBLE_TAP_WINDOW = 320;

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
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [feedback, setFeedback] = useState("");
  const [startedAt] = useState(new Date().toISOString());

  const selectedRef = useRef<number | null>(null);
  const answersRef = useRef<QuizAnswer[]>([]);
  const submittedRef = useRef(false);
  const tapTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const question = pool[index];
  const explanation = question
    ? loadExplanations(examId, question.subjectId).find((x) => x.id === question.id)
    : undefined;

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current !== null) window.clearTimeout(tapTimerRef.current);
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Exam mode: browser back is blocked while the quiz is active.
  useEffect(() => {
    if (!question) return;

    const state = { mediCetamolQuiz: true };
    window.history.pushState(state, "", window.location.href);

    const blockBack = () => window.history.pushState(state, "", window.location.href);
    window.addEventListener("popstate", blockBack);
    return () => window.removeEventListener("popstate", blockBack);
  }, [question?.id]);

  useEffect(() => {
    if (!question) return;

    getQuestionProgress(question.id).then((p) => setBookmarked(Boolean(p?.bookmarked)));

    selectedRef.current = null;
    submittedRef.current = false;
    setSelected(null);
    setSubmitted(false);
    setTimedOut(false);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setFeedback("");
  }, [question?.id]);

  const showFeedback = (message: string) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    setFeedback(message);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 1400);
  };

  async function submitCurrent(choice: number | null = selectedRef.current, timeout = false) {
    if (submittedRef.current || !question) return;

    const correct = choice !== null && choice === question.answer;
    const nextAnswers: QuizAnswer[] = [
      ...answersRef.current,
      { qid: question.id, selected: choice, correct },
    ];

    answersRef.current = nextAnswers;
    submittedRef.current = true;
    setAnswers(nextAnswers);
    setSubmitted(true);
    setTimedOut(timeout);

    if (timeout) {
      setSecondsLeft(0);
      showFeedback("Time over");
    } else {
      showFeedback(correct ? "Correct" : "Incorrect");
    }

    if (mode === "direct") {
      await recordDirectAnswer(question.id, correct);
    }
  }

  useEffect(() => {
    if (!timerEnabled || submitted || !question) return;

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
  }, [timerEnabled, submitted, question?.id]);

  if (!pool.length) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-12 text-center">
        <h1 className="text-xl font-bold">No questions available</h1>
        <p className="mt-2 text-sm text-slate-500">Add verified PYQs to this section first.</p>
        <Link
          to={`/pyqs/${exam}`}
          className="mt-5 inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Back to PYQs
        </Link>
      </main>
    );
  }

  const finish = async () => {
    showFeedback("Final submission");

    await saveQuizResult({
      exam: examId,
      questionIds: pool.map((q) => q.id),
      answers: answersRef.current,
      customModule: mode === "custom",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    navigate(`/result/${examId}`, {
      state: {
        total: pool.length,
        answers: answersRef.current,
        custom: mode === "custom",
        examFinished: true,
      },
    });
  };

  const next = () => {
    if (!submittedRef.current || index >= pool.length - 1) return;
    setIndex((i) => i + 1);
  };

  const previous = () => {
    if (!submittedRef.current || index <= 0) return;
    setIndex((i) => i - 1);
  };

  const handleSubmitTap = () => {
    if (submittedRef.current || !timerEnabled) return;

    // Before half-time, a tap only gives feedback. Never submit on a single tap.
    if (tapTimerRef.current !== null) window.clearTimeout(tapTimerRef.current);

    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      showFeedback(
        secondsLeft > HALF_TIME
          ? "Double tap Submit after half-time"
          : "Double tap to submit"
      );
    }, DOUBLE_TAP_WINDOW);
  };

  const handleSubmitDoubleTap = () => {
    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }

    if (submittedRef.current || !timerEnabled) return;

    if (secondsLeft > HALF_TIME) {
      showFeedback("Submit available after half-time");
      return;
    }

    void submitCurrent(selectedRef.current);
  };

  const handleOptionSelect = (choice: number) => {
    if (submittedRef.current) return;

    if (selectedRef.current === choice) {
      selectedRef.current = null;
      setSelected(null);
      showFeedback("Response cleared");
      return;
    }

    selectedRef.current = choice;
    setSelected(choice);
    setFeedback("");
  };

  const bookmark = async () => {
    if (!question) return;
    const result = await toggleBookmark(question.id);
    setBookmarked(result.bookmarked);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const timerProgress = (secondsLeft / SECONDS_PER_QUESTION) * 100;
  const danger = secondsLeft <= LAST_TEN_SECONDS && !submitted;

  return (
    <main className="relative mx-auto min-h-screen max-w-4xl px-2 pb-24 pt-1 sm:px-3 sm:pt-2">
      {/* Timer stays in the original compact control; pause is INSIDE it. */}
      <div className="mb-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setTimerEnabled((v) => !v)}
          disabled={submitted}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium hover:bg-slate-900 disabled:opacity-30 ${
            danger
              ? "border-red-900/70 bg-red-950/30 text-red-400"
              : "border-slate-800 text-slate-400"
          }`}
          aria-label={timerEnabled ? "Pause timer" : "Resume timer"}
        >
          {timerEnabled ? <Pause size={13} /> : <Play size={13} />}
          {mm}:{ss}
        </button>
        <span className="text-xs text-slate-500">{index + 1}/{pool.length}</span>
      </div>

      {/* Timer bar directly below the header/timer area. */}
      <div className={`mb-2 h-1 overflow-hidden rounded-full ${danger ? "bg-red-950/70" : "bg-slate-900"}`}>
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${danger ? "bg-red-500" : "bg-slate-400"}`}
          style={{ width: `${timerProgress}%` }}
        />
      </div>

      {/* The question itself gets the maximum available width. */}
      <QuestionCard
        question={question}
        explanation={explanation}
        selected={selected}
        submitted={submitted}
        timedOut={timedOut}
        bookmarked={bookmarked}
        onSelect={handleOptionSelect}
        onBookmark={bookmark}
      />

      {/* Temporary feedback only. No permanent disclaimer. */}
      <div
        className={`pointer-events-none fixed bottom-[5.25rem] left-1/2 z-40 -translate-x-1/2 rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-xs text-slate-300 shadow-lg transition-opacity ${
          feedback ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {feedback}
      </div>

      {/* Fixed navigation at the bottom of the viewport. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-900 bg-[#080b10]/95 px-2 py-2 backdrop-blur sm:px-3">
        <div className="mx-auto flex max-w-4xl items-stretch gap-2">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmitTap}
              onDoubleClick={handleSubmitDoubleTap}
              disabled={!timerEnabled}
              className={`w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-25 ${
                selected !== null ? "opacity-100" : "opacity-40"
              }`}
              aria-label="Double tap to submit current question"
            >
              SUBMIT
            </button>
          ) : index < pool.length - 1 ? (
            <>
              <button
                type="button"
                onClick={previous}
                disabled={index === 0}
                className="w-16 shrink-0 rounded-xl bg-slate-100 px-3 py-3.5 text-slate-950 disabled:opacity-25"
                aria-label="Previous question"
              >
                <ArrowLeft className="mx-auto" size={20} />
              </button>

              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-950"
              >
                <span className="flex items-center justify-center gap-2">
                  NEXT
                  <ChevronRight size={18} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => void finish()}
                className="w-16 shrink-0 rounded-xl bg-slate-100 px-3 py-3.5 text-slate-950"
                aria-label="Final submit"
              >
                <ClipboardCheck className="mx-auto" size={23} strokeWidth={2.2} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={previous}
                className="w-16 shrink-0 rounded-xl bg-slate-100 px-3 py-3.5 text-slate-950"
                aria-label="Previous question"
              >
                <ArrowLeft className="mx-auto" size={20} />
              </button>

              <button
                type="button"
                onClick={() => void finish()}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-950"
                aria-label="Final submit"
              >
                <span className="flex items-center justify-center gap-2">
                  <ClipboardCheck size={22} strokeWidth={2.2} />
                  FINAL SUBMIT
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
