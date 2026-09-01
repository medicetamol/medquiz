import { Bookmark, Check, X } from "lucide-react";
import type { PYQQuestion, PYQExplanation } from "../types";

interface Props {
  question: PYQQuestion;
  explanation?: PYQExplanation;
  selected: number | null;
  submitted: boolean;
  timedOut?: boolean;
  bookmarked: boolean;
  onSelect: (index: number) => void;
  onBookmark: () => void;
}

export default function QuestionCard({
  question,
  explanation,
  selected,
  submitted,
  timedOut = false,
  bookmarked,
  onSelect,
  onBookmark,
}: Props) {
  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-4 shadow-soft sm:px-5 sm:py-6">
      {/* During the active question this metadata is at the top. */}
      {!submitted && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{question.id}</span>
            <span>•</span>
            <span>{question.year}</span>
            {question.topicName && (
              <>
                <span>•</span>
                <span className="truncate">{question.topicName}</span>
              </>
            )}
          </div>

          <button
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={onBookmark}
            className={`shrink-0 rounded-lg p-2 ${bookmarked ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
          >
            <Bookmark size={19} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      )}

      <h2 className="text-base font-semibold leading-7 text-slate-100 sm:text-lg">
        {question.question}
      </h2>

      <div className="mt-5 space-y-2.5">
        {question.options.map((option, index) => {
          const isCorrect = submitted && index === question.answer;
          const isWrong = submitted && selected === index && index !== question.answer;
          const isSelected = selected === index;

          // Normal answered state: green = correct, red = incorrect.
          // Special timeout state: when there was NO response, only the correct
          // option gets a subdued/dark treatment rather than green.
          const correctClass =
            timedOut && selected === null
              ? "border-slate-600 bg-slate-800/70 text-slate-300"
              : "border-emerald-500/70 bg-emerald-500/10 text-emerald-100";

          const wrongClass =
            "border-red-500/70 bg-red-500/10 text-red-100";

          return (
            <button
              key={index}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(index)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                isCorrect
                  ? correctClass
                  : isWrong
                    ? wrongClass
                    : isSelected
                      ? "border-slate-400 bg-slate-800/80 text-slate-100"
                      : "border-slate-800 bg-slate-950/50 text-slate-100 hover:border-slate-600"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  isCorrect && !(timedOut && selected === null)
                    ? "bg-emerald-500/20 text-emerald-300"
                    : isWrong
                      ? "bg-red-500/20 text-red-300"
                      : "bg-slate-800 text-slate-300"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 pt-1">{option}</span>
              {isCorrect && <Check size={17} className="mt-1 shrink-0" />}
              {isWrong && <X size={17} className="mt-1 shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>

      {submitted && explanation && (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm leading-6 text-slate-300">{explanation.explanation}</p>
          {explanation.keyPoint && (
            <p className="mt-3 border-l-2 border-slate-600 pl-3 text-sm font-medium text-slate-200">
              {explanation.keyPoint}
            </p>
          )}
        </div>
      )}

      {/* After submission, move QID/year/topic to the bottom as requested. */}
      {submitted && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{question.id}</span>
            <span>•</span>
            <span>{question.year}</span>
            {question.topicName && (
              <>
                <span>•</span>
                <span className="truncate">{question.topicName}</span>
              </>
            )}
          </div>

          <button
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={onBookmark}
            className={`shrink-0 rounded-lg p-2 ${bookmarked ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
          >
            <Bookmark size={19} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      )}
    </section>
  );
}
