import { ArrowLeft, CheckSquare, Square } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EXAMS, SUBJECTS, getSubject } from "../constants";
import { getAllQuestions } from "../data/questions";
import { useEffect, useMemo, useState } from "react";
import type { StatusFilter } from "../types";
import { getAllQuestionProgress } from "../lib/db";
import FilterBar from "../components/FilterBar";

export default function ModuleBuilder() {
  const { exam } = useParams();
  const navigate = useNavigate();
  const examId = exam as "NEET-PG" | "INI-CET" | "FMGE";
  const all = useMemo(() => getAllQuestions(examId), [examId]);
  const [subjectId, setSubjectId] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, Awaited<ReturnType<typeof getAllQuestionProgress>>[number]>>({});

  useEffect(() => {
    getAllQuestionProgress().then((items) => {
      setProgress(Object.fromEntries(items.map((x) => [x.qid, x])));
    });
  }, []);

  const topics = Array.from(
    new Map(
      all
        .filter((q) => subjectId === "all" || q.subjectId === subjectId)
        .map((q) => [q.topicId, q.topicName ?? q.topicId])
    ).entries()
  );

  const visible = all.filter((q) => {
    if (subjectId !== "all" && q.subjectId !== subjectId) return false;
    if (topicId !== "all" && q.topicId !== topicId) return false;
    const p = progress[q.id];
    if (filter === "incorrect") return Boolean(p?.firstIncorrect || p?.directIncorrect);
    if (filter === "correct") return Boolean(p?.directCorrect);
    if (filter === "bookmark") return Boolean(p?.bookmarked);
    return true;
  });

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = () => {
    if (!selected.size) return;
    navigate(`/quiz/${examId}/custom?ids=${encodeURIComponent([...selected].join(","))}&mode=custom`);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to={`/pyqs/${exam}`} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200">
        <ArrowLeft size={16} /> {EXAMS.find((e) => e.id === examId)?.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Module</h1>
        <p className="mt-1 text-sm text-slate-500">Choose subjects, topics and question status.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <span className="mb-2 block text-xs text-slate-500">Subject</span>
          <select
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); setTopicId("all"); }}
            className="w-full bg-transparent text-sm outline-none"
          >
            <option value="all">All subjects</option>
            {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <span className="mb-2 block text-xs text-slate-500">Topic</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          >
            <option value="all">All topics</option>
            {topics.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <FilterBar value={filter} onChange={setFilter} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No questions match these filters.</div>
        ) : visible.map((q) => {
          const checked = selected.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => toggle(q.id)}
              className="flex w-full items-start gap-3 border-b border-slate-800 bg-slate-900/40 p-4 text-left last:border-0 hover:bg-slate-900"
            >
              {checked ? <CheckSquare size={19} className="mt-0.5 shrink-0" /> : <Square size={19} className="mt-0.5 shrink-0 text-slate-600" />}
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-slate-500">{q.id} • {getSubject(q.subjectId)?.name}</span>
                <span className="mt-1 block text-sm text-slate-200">{q.question}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-3 mt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#10161e]/95 p-3 shadow-soft backdrop-blur">
          <span className="flex-1 text-xs text-slate-500">{selected.size} selected</span>
          <button
            disabled={!selected.size}
            onClick={create}
            className="rounded-xl bg-slate-100 px-5 py-3 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            CREATE MODULE
          </button>
        </div>
      </div>
    </main>
  );
}
