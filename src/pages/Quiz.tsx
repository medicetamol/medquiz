import {
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardCheck,
  Pause,
  Play,
  Clock,
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
const HALF_TIME = 30;
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
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [bookmarked, setBookmarked] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [examFinished, setExamFinished] = useState(false);

  const [startedAt] = useState(new Date().toISOString());

  const selectedRef = useRef<number | null>(null);
  const answersRef = useRef<QuizAnswer[]>([]);
  const submittedRef = useRef(false);
  const pausedRef = useRef(false);

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

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /*
   * EXAM MODE
   * Back navigation is blocked while the exam is active.
   * Once FINAL SUBMIT completes the exam, normal navigation is restored.
   */
  useEffect(() => {
    if (!question || examFinished) return;

    const state = { mediCetamolQuiz: true };
    window.history.pushState(state, "", window.location.href);

    const blockBack = () => {
      window.history.pushState(state, "", window.location.href);
    };

    window.addEventListener("popstate", blockBack);

    return () => window.removeEventListener("popstate", blockBack);
  }, [question?.id, examFinished]);

  useEffect(() => {
    if (!question) return;

    getQuestionProgress(question.id).then((p) => {
      setBookmarked(Boolean(p?.bookmarked));
    });

    selectedRef.current = null;
    submittedRef.current = false;

    setSelected(null);
    setSubmitted(false);
    setTimedOut(false);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setPaused(false);
    setFeedback("");
  }, [question?.id]);

  async function submitCurrent(
    choice: number | null = selectedRef.current,
    timeout = false
  ) {
    if (submittedRef.current || !question) return;

    const correct = choice !== null && choice === question.answer;

    const nextAnswers: QuizAnswer[] = [
      ...answersRef.current,
      {
        qid: question.id,
        selected: choice,
        correct,
      },
    ];

    answersRef.current = nextAnswers;
    submittedRef.current = true;

    setAnswers(nextAnswers);
    setSubmitted(true);
    setTimedOut(timeout);
    setFeedback("");

    if (mode === "direct") {
      await recordDirectAnswer(question.id, correct);
    }
  }

  // Timer pauses only through the explicit Pause button.
  useEffect(() => {
    if (!question || submitted || paused || examFinished) return;

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
  }, [question?.id, submitted, paused, examFinished]);

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

  const finishExam = async () => {
    await saveQuizResult({
      exam: examId,
      questionIds: pool.map((q) => q.id),
      answers: answersRef.current,
      customModule: mode === "custom",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    setExamFinished(true);

    navigate(`/result/${examId}`, {
      state: {
        total: pool.length,
        answers: answersRef.current,
        custom: mode === "custom",
        examFinished: true,
      },
    });
  };

  const goNext = () => {
    if (!submittedRef.current) return;

    if (index < pool.length - 1) {
      setIndex((value) => value + 1);
    }
  };

  const goPrevious = () => {
    if (!submittedRef.current || index <= 0) return;

    setIndex((value) => value - 1);
  };

  /*
   * Single tap before half-time:
   * feedback only.
   *
   * Double tap after half-time:
   * submit the current response.
   */
  const handleSubmitTap = () => {
    if (submittedRef.current) return;

    setFeedback(
      secondsLeft > HALF_TIME
        ? "Double tap Submit after half-time to submit."
        : "Double tap Submit to confirm."
    );

    window.setTimeout(() => setFeedback(""), 1500);
  };

  const handleSubmitDoubleTap = () => {
    if (submittedRef.current || secondsLeft > HALF_TIME) return;

    void submitCurrent(selectedRef.current);
  };

  const handleOptionSelect = (choice: number) => {
    if (submittedRef.current) return;

    if (selectedRef.current === choice) {
      selectedRef.current = null;
      setSelected(null);
      setFeedback("Response cleared");
      window.setTimeout(() => setFeedback(""), 1000);
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

  const timerProgress =
    (secondsLeft / SECONDS_PER_QUESTION) * 100;

  const danger =
    secondsLeft <= LAST_TEN_SECONDS && !submitted;

  /*
   * Before submission:
   *       [       SUBMIT       ]
   *
   * After normal submission:
   *       [ < ] [ NEXT ] [ FINAL ]
   *
   * Last question after submission:
   *       [ < ] [ FINAL SUBMIT ]
   *
   * If user goes back from the last question:
   *       [ < ] [ NEXT ] [ FINAL ]
   */
  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-3xl select-none px-4 py-5 sm:py-8">
      <div className="mb-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          disabled={submitted || examFinished}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 disabled:opacity-30"
          aria-label={paused ? "Resume timer" : "Pause timer"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? "RESUME" : "PAUSE"}
        </button>

        <div
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
            danger
              ? "border-red-900/70 bg-red-950/30 text-red-400"
              : "border-slate-800 text-slate-400"
          }`}
        >
          <Clock size={14} />
          {mm}:{ss}
        </div>

        <span className="text-xs text-slate-500">
          {index + 1}/{pool.length}
        </span>
      </div>

      {paused && !submitted && (
        <div className="mb-3 rounded-lg border border-slate-800 px-3 py-2 text-center text-xs text-slate-500">
          Quiz paused
        </div>
      )}

      <div
        className={`mb-4 h-1.5 overflow-hidden rounded-full ${
          danger ? "bg-red-950/60" : "bg-slate-900"
        }`}
      >
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${
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
        timedOut={timedOut}
        bookmarked={bookmarked}
        onSelect={handleOptionSelect}
        onBookmark={bookmark}
      />

      <div className="mt-3 min-h-5 text-center text-xs text-slate-500">
        {feedback}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmitTap}
          onDoubleClick={handleSubmitDoubleTap}
          disabled={paused}
          className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-950 opacity-40 disabled:cursor-not-allowed disabled:opacity-20"
          aria-label="Double tap to submit current question"
        >
          SUBMIT
        </button>
      ) : (
        <div className="mt-2 flex items-stretch gap-2">
          {index > 0 ? (
            <button
              type="button"
              onClick={goPrevious}
              className="w-16 rounded-xl bg-slate-100 px-3 py-4 text-slate-950"
              aria-label="Previous question"
            >
              <ArrowLeft className="mx-auto" size={20} />
            </button>
          ) : (
            <div className="w-16" />
          )}

          {index < pool.length - 1 ? (
            <>
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-950"
              >
                <span className="flex items-center justify-center gap-2">
                  NEXT
                  <ChevronRight size={18} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => void finishExam()}
                className="w-16 rounded-xl bg-slate-100 px-3 py-4 text-slate-950"
                aria-label="Final submit"
              >
                <ClipboardCheck
                  className="mx-auto"
                  size={23}
                  strokeWidth={2.2}
                />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void finishExam()}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-950"
              >
                <span className="flex items-center justify-center gap-2">
                  <ClipboardCheck size={22} strokeWidth={2.2} />
                  FINAL SUBMIT
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {submitted && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Check size={14} />
          {timedOut && selected === null
            ? "Time over — response unmarked"
            : "Answer recorded"}
        </div>
      )}
    </main>
  );
}
