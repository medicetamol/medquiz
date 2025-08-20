import { useEffect, useMemo, useState } from "react";
import type { Bank } from "../types";

export default function Home() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [filter, setFilter] = useState({ subject: "All", subtopic: "All", exam: "All" });

  useEffect(() => {
    fetch("/questions.json").then(r => r.json()).then(setBank).catch(() => {});
  }, []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    bank?.items.forEach(i => set.add(i.subject));
    return ["All", ...Array.from(set).sort()];
  }, [bank]);

  const subtopics = useMemo(() => {
    const set = new Set<string>();
    bank?.items.filter(i => filter.subject === "All" || i.subject === filter.subject)
      .forEach(i => i.subtopic && set.add(i.subtopic));
    return ["All", ...Array.from(set).sort()];
  }, [bank, filter.subject]);

  const exams = useMemo(() => {
    const set = new Set<string>();
    bank?.items.forEach(i => set.add(i.exam));
    return ["All", ...Array.from(set).sort()];
  }, [bank]);

  const count = useMemo(() => bank?.items.filter(i =>
    (filter.subject === "All" || i.subject === filter.subject) &&
    (filter.subtopic === "All" || i.subtopic === filter.subtopic) &&
    (filter.exam === "All" || i.exam === filter.exam)
  ).length ?? 0, [bank, filter]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand to-purple-400 text-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold">Practice PYQs</h1>
        <p className="opacity-90 mt-1">NEET PG & INICET across subjects and subtopics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select className="px-4 py-3 rounded-2xl border" value={filter.subject} onChange={e => setFilter(f => ({...f, subject: e.target.value}))}>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="px-4 py-3 rounded-2xl border" value={filter.subtopic} onChange={e => setFilter(f => ({...f, subtopic: e.target.value}))}>
          {subtopics.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="px-4 py-3 rounded-2xl border" value={filter.exam} onChange={e => setFilter(f => ({...f, exam: e.target.value}))}>
          {exams.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <a
        href={`/quiz?subject=${encodeURIComponent(filter.subject)}&subtopic=${encodeURIComponent(filter.subtopic)}&exam=${encodeURIComponent(filter.exam)}`}
        className="inline-flex items-center justify-center w-full sm:w-auto bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-2xl font-medium"
      >
        Start Quiz ({count})
      </a>

      <div className="text-sm text-purple-500">{bank ? `${bank.items.length} questions loaded` : "Loading sample bank..."}</div>
    </div>
  );
}
