import { ArrowLeft, RotateCcw } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { QuizAnswer } from "../types";

export default function Result() {
  const { exam } = useParams();
  const location = useLocation();
  const state = location.state as { total: number; answers: QuizAnswer[]; custom: boolean } | null;

  const total = state?.total ?? 0;
  const answers = state?.answers ?? [];
  const correct = answers.filter((a) => a.correct).length;
  const attempted = answers.length;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-wider text-slate-500">Result</p>
        <h1 className="mt-2 text-3xl font-bold">{correct}/{total}</h1>
        <p className="mt-1 text-sm text-slate-500">{accuracy}% accuracy • {attempted} attempted</p>

        <div className="mt-7 grid grid-cols-3 gap-2">
          <Stat label="Correct" value={correct} />
          <Stat label="Incorrect" value={attempted - correct} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </div>

        {state?.custom && (
          <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-500">
            Custom module attempt. Correct/incorrect QBank statistics were not changed.
          </p>
        )}

        <div className="mt-7 flex gap-2">
          <Link to={`/pyqs/${exam}`} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-950">
            Back to PYQs
          </Link>
          <Link to="/progress" className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-semibold">
            Progress
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
