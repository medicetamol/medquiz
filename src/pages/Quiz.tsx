import { ArrowLeft, Bookmark, ChevronRight, ClipboardCheck, Clock, Pause, Play } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { findQuestion, getAllQuestions, hasDetailedExplanation, loadDetailedExplanation, loadExplanations } from "../data/questions";
import { getQuestionProgress, recordDirectAnswer, saveQuizResult, toggleBookmark } from "../lib/db";
import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import MarkdownContent from "../components/MarkdownContent";
import type { Exam, QuizAnswer } from "../types";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

const SECONDS_PER_QUESTION = 60;
const HALF_TIME = 30;
const LAST_TEN_SECONDS = 10;

export default function Quiz() {
  const { exam, subjectId, questionId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const targetQuestion = useMemo(
    () => (questionId ? findQuestion(questionId) : undefined),
    [questionId]
  );
  const examId = ((exam as Exam | undefined) ?? targetQuestion?.exam ?? "NEET-PG") as Exam;
  const isSolveLink = Boolean(questionId);
  const mode = search.get("mode") === "custom" ? "custom" : "direct";
  const ids = (search.get("ids") ?? "").split(",").filter(Boolean);
  const topic = search.get("topic") ?? "all";

  const pool = useMemo(() => {
    if (!examId) return [];

    const allQuestions = getAllQuestions(examId);

    if (isSolveLink) {
      if (!targetQuestion) return [];

      const subjectQuestions = allQuestions.filter(
        (q) => q.subjectId === targetQuestion.subjectId
      );
      const topicQuestions = subjectQuestions.filter(
        (q) => q.topicId === targetQuestion.topicId
      );

      // A shared PYQ starts the session. If its topic has at least 5 questions,
      // continue with that topic; otherwise fall back to a subject mixed bag.
      const candidates = topicQuestions.length >= 5 ? topicQuestions : subjectQuestions;
      const remaining = shuffle(candidates.filter((q) => q.id !== targetQuestion.id)).slice(0, 39);

      return [targetQuestion, ...remaining];
    }

    let questions = allQuestions;

    if (mode === "custom") {
      questions = questions.filter((q) => ids.includes(q.id));
    } else if (subjectId && subjectId !== "custom") {
      questions = questions.filter((q) => q.subjectId === subjectId);
      if (topic !== "all") questions = questions.filter((q) => q.topicId === topic);
    }

    return shuffle(questions).slice(0, 40);
  }, [examId, isSolveLink, targetQuestion?.id, mode, ids.join(","), subjectId, topic]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const [feedback, setFeedback] = useState("");
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [startedAt] = useState(new Date().toISOString());

  const selectedRef = useRef<number | null>(null);
  const answersRef = useRef<QuizAnswer[]>([]);
  const submittedRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const question = pool[index];
  const explanation = question && examId
    ? loadExplanations(examId, question.subjectId).find((x) => x.id === question.id)
    : undefined;
  const detailedAvailable = Boolean(
    question &&
    examId &&
    hasDetailedExplanation(examId, question.subjectId, question.id)
  );
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Prevent browser back while the quiz is active. There is no Exit control during the quiz.
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

    // Restore a previously submitted response when moving back to a question.
    const previousAnswer = answersRef.current.find((a) => a.qid === question.id);
    const restoredSelection = previousAnswer?.selected ?? null;

    selectedRef.current = restoredSelection;
    submittedRef.current = Boolean(previousAnswer);

    setSelected(restoredSelection);
    setSubmitted(Boolean(previousAnswer));
    setTimedOut(Boolean(previousAnswer && previousAnswer.selected === null));
    setSecondsLeft(SECONDS_PER_QUESTION);
    setTimerEnabled(true);
    setFeedback("");
  }, [question?.id]);
  useEffect(() => {
    setDetailedExplanation(null);
    setShowDetails(false);
    setLoadingDetails(false);
  }, [question?.id]);

  const toggleDetails = async () => {
    if (!question || !examId || !detailedAvailable) return;

    if (showDetails) {
      setShowDetails(false);
      return;
    }

    if (!detailedExplanation) {
      setLoadingDetails(true);
      const content = await loadDetailedExplanation(
        examId,
        question.subjectId,
        question.id
      );
      setDetailedExplanation(content);
      setLoadingDetails(false);
      if (!content) {
        showFeedback("Detailed explanation unavailable");
        return;
      }
    }

    setShowDetails(true);
  };

  const showFeedback = (message: string) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    setFeedback(message);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 1200);
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
    setTimedOut(timeout && choice === null);

    if (timeout) {
      setSecondsLeft(0);
    }

    if (mode === "direct") {
      await recordDirectAnswer(question.id, correct);
    }
  }

  // Timer runs only for an unanswered active question. Pause remains INSIDE the timer control.
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

  const requestFinalSubmit = () => {
    setShowFinalConfirm(true);
  };

  const finish = async () => {
    setShowFinalConfirm(false);

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

  // Submit rules:
  // - selected response: single tap submits at any time
  // - no response and <=30 sec remaining: single tap submits unanswered
  // - no response and >30 sec remaining: single tap gives temporary feedback only
  const handleSubmit = () => {
    if (submittedRef.current || !timerEnabled) return;

    const hasSelection = selectedRef.current !== null;
    const halfTimeReached = secondsLeft <= HALF_TIME;

    if (hasSelection || halfTimeReached) {
      void submitCurrent(selectedRef.current);
      return;
    }

    showFeedback("Wait for 30s to skip");
  };

  const handleOptionSelect = (choice: number) => {
    if (submittedRef.current) return;

    if (selectedRef.current === choice) {
      selectedRef.current = null;
      setSelected(null);
      return;
    }

    selectedRef.current = choice;
    setSelected(choice);
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

  // Muted neutral controls: selection does not recolour or fade the Submit button.
  const actionClass =
    "rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-750";

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-4xl px-1 pb-24 pt-1 sm:px-2 sm:pt-2">
      {/* 1. Progress/timer bar is the first element below the app header. */}
      <div
        className={`mb-2 h-1 overflow-hidden rounded-full ${danger ? "bg-red-950/70" : "bg-slate-900"}`}
        aria-label={`Time remaining ${mm}:${ss}`}
      >
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${danger ? "bg-red-500" : "bg-slate-500"}`}
          style={{ width: `${timerProgress}%` }}
        />
      </div>

      {/* 2. While solving, ONLY question number + timer/pause + bookmark are shown. */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-medium text-slate-500">
          {index + 1}/{pool.length}
        </span>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center overflow-hidden rounded-lg border ${
              danger
                ? "border-red-900/70 bg-red-950/30 text-red-400"
                : "border-slate-800 text-slate-400"
            }`}
          >
            <button
              type="button"
              onClick={() => setTimerEnabled((v) => !v)}
              disabled={submitted}
              className="flex min-h-10 items-center px-2.5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={timerEnabled ? "Pause timer" : "Resume timer"}
            >
              {timerEnabled ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <span className="border-l border-slate-800 px-2.5 py-2 text-xs font-medium">
              {mm}:{ss}
            </span>
          </div>

          <button
            type="button"
            onClick={bookmark}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:text-slate-200"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark
              size={21}
              strokeWidth={1.8}
              fill={bookmarked ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      {/* QuestionCard contains only the question/options while active. */}
      <QuestionCard
        question={question}
        selected={selected}
        submitted={submitted}
        timedOut={timedOut}
        bookmarked={bookmarked}
        onSelect={handleOptionSelect}
        onBookmark={bookmark}
        hasDetailedExplanation={detailedAvailable}
        onShareFeedback={showFeedback}
      />

      {submitted && explanation && (
        <section className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Explanation
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{explanation.e}</p>

          {detailedAvailable && (
            <>
              <button
                type="button"
                onClick={toggleDetails}
                disabled={loadingDetails}
                className="mt-3 inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-750 disabled:opacity-60"
              >
                {loadingDetails
                  ? "LOADING..."
                  : showDetails
                    ? "HIDE DETAILS ↑"
                    : "VIEW MORE ↓"}
              </button>

              {showDetails && detailedExplanation && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <MarkdownContent content={detailedExplanation} />
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Temporary feedback only; never a permanent disclaimer. */}
      <div
        className={`pointer-events-none fixed bottom-[5.25rem] left-1/2 z-40 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg transition-opacity ${
          feedback ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {feedback}
      </div>

      {showFinalConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="final-submit-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h2 id="final-submit-title" className="text-center text-lg font-semibold text-slate-100">
              Are you sure?
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={finish}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowFinalConfirm(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom navigation. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-900 bg-[#080b10]/95 px-1.5 py-2 backdrop-blur sm:px-2">
        <div className="mx-auto flex max-w-4xl items-stretch gap-2">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!timerEnabled || (selected === null && secondsLeft > HALF_TIME)}
              className={`w-full ${actionClass} disabled:cursor-not-allowed disabled:opacity-100`}
            >
              SUBMIT
            </button>
          ) : index < pool.length - 1 ? (
            <>
              <button
                type="button"
                onClick={previous}
                disabled={index === 0}
                className={`w-16 shrink-0 ${actionClass} px-3 disabled:cursor-not-allowed`}
                aria-label="Previous question"
              >
                <ArrowLeft className="mx-auto" size={20} />
              </button>

              <button type="button" onClick={next} className={`flex-1 ${actionClass}`}>
                <span className="flex items-center justify-center gap-2">
                  {isSolveLink ? "SOLVE MORE" : "NEXT"}
                  <ChevronRight size={18} />
                </span>
              </button>

              <button
                type="button"
                onClick={requestFinalSubmit}
                className={`w-16 shrink-0 ${actionClass} px-3`}
                aria-label="Final submit"
              >
                <ClipboardCheck className="mx-auto" size={23} strokeWidth={2.1} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={previous}
                className={`w-16 shrink-0 ${actionClass} px-3`}
                aria-label="Previous question"
              >
                <ArrowLeft className="mx-auto" size={20} />
              </button>

              <button
                type="button"
                onClick={requestFinalSubmit}
                className={`flex-1 ${actionClass}`}
                aria-label="Final submit"
              >
                <span className="flex items-center justify-center gap-2">
                  <ClipboardCheck size={22} strokeWidth={2.1} />
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