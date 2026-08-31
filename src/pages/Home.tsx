import { ArrowRight, BarChart3, BookOpen, Flame } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BookOpen size={18} />
          <span>PYQs for medicos</span>
        </div>

        <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
          NEET PG & INI-CET PYQs
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          A simple, focused PYQ practice platform for NEET PG, INI-CET and FMGE.
          Solve questions, bookmark important ones and track your actual QBank performance.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/pyqs"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-white"
          >
            Proceed to PYQs <ArrowRight size={17} />
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <BarChart3 size={17} /> Progress
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          [BookOpen, "PYQs", "Exam-wise and subject-wise"],
          [Flame, "Streak", "Build consistent practice"],
          [BarChart3, "Progress", "See where to focus"]
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof BookOpen;
          return (
            <div key={title as string} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <I size={20} className="text-slate-400" />
              <h3 className="mt-4 text-sm font-bold">{title as string}</h3>
              <p className="mt-1 text-xs text-slate-500">{text as string}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
