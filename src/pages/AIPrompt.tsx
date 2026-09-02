import { Copy, Share2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { findQuestion } from "../data/questions";
import { formatQuestionForShare, getSiteUrl, shareOrCopy } from "../lib/sharing";

const MASTER_PROMPT = `You are a medical student preparing for NEET PG & INICET.

I will send you MCQs — clinical, factual/number-based, or image-based.

For EACH question:

1. PROBLEM REPRESENTATION
One line: age/sex + key symptom/sign + 1–2 key discriminators.

2. KEY CLUES
Give only 3–5 high-yield clues. Ignore fluff.

3. ELIMINATION-FIRST APPROACH
Solve from scratch as if you do NOT know the correct answer.

4. OPTION ELIMINATION
Eliminate options ONE BY ONE with crisp, exam-relevant reasons.
For close distractors, state: “Tempting, but wrong because…”

5. FINAL ANSWER
State the correct option clearly.

Keep the response VERY CONCISE.
Prioritize high-yield NEET PG/INICET reasoning over lengthy explanations.
Use standard medical terminology.`;

export default function AIPrompt() {
  const { questionId } = useParams();
  const question = useMemo(() => findQuestion(questionId ?? ""), [questionId]);
  const [copied, setCopied] = useState(false);

  const prompt = question
    ? `${MASTER_PROMPT}\n\nQUESTION\n${formatQuestionForShare(question)}`
    : "";

  if (!question) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-bold">Question not found</h1>
        <Link to="/" className="mt-5 inline-flex rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950">
          Home
        </Link>
      </main>
    );
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const sharePrompt = async () => {
    await shareOrCopy({
      title: `mediCetamol AI Prompt • ${question.id}`,
      text: prompt,
      url: getSiteUrl(`/ai/${question.id}`),
    });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-5 sm:py-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Sparkles size={17} /> AI Explanation Prompt
        </div>
        <p className="mt-1 text-xs text-slate-500">{question.id}</p>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{question.question}</p>
          <div className="mt-3 space-y-1.5 text-sm text-slate-400">
            {question.options.map((option, index) => (
              <p key={index}>{String.fromCharCode(65 + index)}. {option}</p>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={copyPrompt}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            <Copy size={16} /> {copied ? "COPIED" : "COPY PROMPT"}
          </button>
          <button
            type="button"
            onClick={sharePrompt}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-200"
            aria-label="Share AI prompt"
          >
            <Share2 size={18} />
          </button>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">Preview prompt</summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-400">
            {prompt}
          </pre>
        </details>
      </div>
    </main>
  );
}
