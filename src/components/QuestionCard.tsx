import { Bookmark, Check, X } from "lucide-react";
import type { PYQQuestion, PYQExplanation } from "../types";

interface Props {
  question: PYQQuestion;
  explanation?: PYQExplanation;
  selected: number | null;
  submitted: boolean;
  bookmarked: boolean;
  onSelect: (index: number) => void;
  onBookmark: () => void;
  minimalBeforeSubmit?: boolean;
}

export default function QuestionCard({
  question,
  explanation,
  selected,
  submitted,
  bookmarked,
  onSelect,
  onBookmark,
  minimalBeforeSubmit = false
}: Props) {
  const showTopMeta = !minimalBeforeSubmit;

  const Meta = () => (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{question.id}</span>
        <span>•</span>
        <span>{question.year}</span>
        {question.topicName && (
          <>
            <span>•</span>
            <span>{question.topicName}</span>
          </>
        )}
      </div>
      <button
        type="button"
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        onClick={onBookmark}
        className={`rounded-lg p-2 ${bookmarked ? "text-white" : "text-slate-500 hover:text-slate-200"}`}
      >
        <Bookmark size={19} fill={bookmarked ? "currentColor" : "none"} />
      </button>
    </div>
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft sm:p-7">
      {showTopMeta && <div className="mb-5"><Meta /></div>}

      <h2 className="text-base font-semibold leading-7 text-slate-100 sm:text-lg">
        {question.question}
      </h2>

      <div className="mt-6 space-y-2.5">
        {question.options.map((option, index) => {
          const isCorrect = submitted && index === question.answer;
          const isWrong = submitted && selected === index && index !== question.answer;
          const isSelected = selected === index;

          return (
            <button
              key={index}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(index)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                isCorrect
                  ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100"
                  : isWrong
                    ? "border-red-500/70 bg-red-500/10 text-red-100"
                    : isSelected
                      ? "border-slate-500 bg-slate-800/80"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-600"
              }`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                isCorrect
                  ? "bg-emerald-500/20 text-emerald-300"
                  : isWrong
                    ? "bg-red-500/20 text-red-300"
                    : "bg-slate-800 text-slate-300"
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 pt-1">{option}</span>
              {isCorrect && <Check size={17} className="mt-1 shrink-0 text-emerald-400" />}
              {isWrong && <X size={17} className="mt-1 shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>

      {minimalBeforeSubmit && submitted && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
          <Meta />
        </div>
      )}

      {submitted && explanation && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm leading-6 text-slate-300">{explanation.explanation}</p>
          {explanation.keyPoint && (
            <p className="mt-3 border-l-2 border-slate-600 pl-3 text-sm font-medium text-slate-200">
              {explanation.keyPoint}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
