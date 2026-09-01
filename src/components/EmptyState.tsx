import { BookOpen } from "lucide-react";

export default function EmptyState({ subject }: { subject: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
      <BookOpen className="mx-auto text-slate-600" size={30} />
      <h3 className="mt-3 font-semibold text-slate-200">
        No PYQs available yet
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        will be added soon
      </p>
      <p className="mt-1 text-sm font-medium text-slate-400">
        Working on it…
      </p>
    </div>
  );
}
