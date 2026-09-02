import { Check, Share2, X, Sparkles } from "lucide-react";
import type { PYQQuestion } from "../types";
import { formatQuestionForShare, getSiteUrl, shareOrCopy } from "../lib/sharing";

interface Props {
  question: PYQQuestion;
  submitted: boolean;
  selected: number | null;
  timedOut?: boolean;
  bookmarked: boolean;
  onSelect: (index: number) => void;
  onBookmark: () => void;
  hasDetailedExplanation?: boolean;
  onShareFeedback?: (message: string) => void;
}

export default function QuestionCard({
  question,
  explanation,
  selected,
  submitted,
  timedOut = false,
  onSelect,
  hasDetailedExplanation = false,
  onShareFeedback,
}: Props) {
  const solveUrl = getSiteUrl(`/solve/${question.id}`);
  const aiUrl = getSiteUrl(`/ai/${question.id}`);

  const shareQuestion = async () => {
    const result = await shareOrCopy({
      title: `mediCetamol • ${question.id}`,
      text: formatQuestionForShare(question),
      url: solveUrl,
    });
    onShareFeedback?.(
      result === "copied" ? "Question copied to clipboard" :
      result === "shared" ? "Share sheet opened" : "Unable to share"
    );
  };

  const askAI = async () => {
    const text = `Explain this NEET PG / INI-CET PYQ using the mediCetamol AI prompt.\n\n${formatQuestionForShare(question)}\n\nAI prompt:\n${aiUrl}`;
    const result = await shareOrCopy({
      title: `Ask AI • ${question.id}`,
      text,
    });
    onShareFeedback?.(
      result === "copied" ? "AI prompt link copied" :
      result === "shared" ? "Share sheet opened" : "Unable to share"
    );
  };

  return (
    <section className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-3 sm:px-4 sm:py-5">
      <h2 className="text-base font-semibold leading-7 text-slate-100 sm:text-lg">
        {question.question}
      </h2>

      <div className="mt-4 space-y-2">
        {question.options.map((option, index) => {
          const isCorrect = submitted && index === question.answer;
          const isWrong = submitted && selected === index && index !== question.answer;
          const isSelected = selected === index;

          const correctClass =
            timedOut && selected === null
              ? "border-sky-700/70 bg-sky-950/40 text-sky-200"
              : "border-emerald-500/70 bg-emerald-500/10 text-emerald-100";
          const wrongClass = "border-red-500/70 bg-red-500/10 text-red-100";

          return (
            <button
              key={index}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(index)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${
                isCorrect ? correctClass : isWrong ? wrongClass : isSelected
                  ? "border-slate-400 bg-slate-800/80 text-slate-100"
                  : "border-slate-800 bg-slate-950/50 text-slate-100 hover:border-slate-600"
              }`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                isCorrect && !(timedOut && selected === null)
                  ? "bg-emerald-500/20 text-emerald-300"
                  : isWrong ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-300"
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="min-w-0 flex-1 pt-1">{option}</span>
              {isCorrect && <Check size={17} className="mt-1 shrink-0" />}
              {isWrong && <X size={17} className="mt-1 shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={shareQuestion}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Share question"
          >
            <Share2 size={15} /> Share
          </button>
          <button
            type="button"
            onClick={askAI}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Ask AI"
          >
            <Sparkles size={15} /> Ask AI
          </button>
        </div>
      </div>

      {submitted && explanation && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Explanation
            </p>
            {hasDetailedExplanation && (
              <span className="text-[11px] text-slate-600">Detailed available</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{explanation.e}</p>
        </div>
      )}
    </section>
  );
}