import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EXAMS, SUBJECTS } from "../constants";
import { getAllQuestions } from "../data/questions";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Exam, StatusFilter } from "../types";
import { getAllQuestionProgress } from "../lib/db";
import FilterBar from "../components/FilterBar";

function MultiSelect({
  label,
  summary,
  open,
  onToggle,
  children
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-slate-500">{label}</span>
          <span className="mt-2 block truncate text-sm text-slate-100">{summary}</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-slate-800">{children}</div>}
    </div>
  );
}

function SelectionList({
  items,
  selected,
  onToggle
}: {
  items: Array<{ id: string; name: string }>;
  selected: string[];
  onToggle: (id: string) => void;
  allId?: string;
}) {
  return (
    <div className="max-h-80 overflow-y-auto">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className="flex w-full items-center gap-3 border-b border-slate-800 px-4 py-3.5 text-left last:border-b-0 hover:bg-slate-900"
          >
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
              active ? "border-slate-300 bg-slate-100 text-slate-950" : "border-slate-600"
            }`}>
              {active && <Check size={14} strokeWidth={3} />}
            </span>
            <span className="flex-1 text-sm text-slate-200">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ModuleBuilder() {
  const { exam } = useParams();
  const navigate = useNavigate();
  const examId = exam as Exam;
  const all = useMemo(() => getAllQuestions(examId), [examId]);

  const [subjects, setSubjects] = useState<string[]>(["all"]);
  const [topics, setTopics] = useState<string[]>(["all"]);
  const [statuses, setStatuses] = useState<StatusFilter[]>(["all"]);
  const [questionCount, setQuestionCount] = useState(40);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState<Record<string, Awaited<ReturnType<typeof getAllQuestionProgress>>[number]>>({});

  useEffect(() => {
    getAllQuestionProgress().then((items) => {
      setProgress(Object.fromEntries(items.map((x) => [x.qid, x])));
    });
  }, []);

  const selectedSubjectSet = useMemo(() => new Set(subjects), [subjects]);
  const selectedTopicSet = useMemo(() => new Set(topics), [topics]);

  const topicItems = useMemo(() => {
    const source = subjects.includes("all")
      ? all
      : all.filter((q) => selectedSubjectSet.has(q.subjectId));
    return Array.from(new Map(source.map((q) => [q.topicId, q.topicName ?? q.topicId])).entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));
  }, [all, subjects, selectedSubjectSet]);

  const matchingCount = useMemo(() => {
    return all.filter((q) => {
      if (!subjects.includes("all") && !selectedSubjectSet.has(q.subjectId)) return false;
      if (!topics.includes("all") && !selectedTopicSet.has(q.topicId)) return false;

      if (statuses.includes("all")) return true;
      const p = progress[q.id];
      return statuses.some((status) => {
        if (status === "incorrect") return Boolean(p?.firstIncorrect || p?.directIncorrect);
        if (status === "correct") return Boolean(p?.directCorrect);
        if (status === "bookmark") return Boolean(p?.bookmarked);
        return true;
      });
    }).length;
  }, [all, subjects, topics, statuses, progress, selectedSubjectSet, selectedTopicSet]);

  const toggleSubjects = (id: string) => {
    if (id === "all") {
      setSubjects(["all"]);
      setTopics(["all"]);
      return;
    }
    const next = subjects.filter((x) => x !== "all");
    if (next.includes(id)) {
      const without = next.filter((x) => x !== id);
      setSubjects(without.length ? without : ["all"]);
    } else {
      setSubjects([...next, id]);
    }
    setTopics(["all"]);
  };

  const toggleTopics = (id: string) => {
    if (id === "all") {
      setTopics(["all"]);
      return;
    }
    const next = topics.filter((x) => x !== "all");
    if (next.includes(id)) {
      const without = next.filter((x) => x !== id);
      setTopics(without.length ? without : ["all"]);
    } else {
      setTopics([...next, id]);
    }
  };

  const create = () => {
    if (creating) return;
    setCreating(true);

    const filtered = all.filter((q) => {
      if (!subjects.includes("all") && !selectedSubjectSet.has(q.subjectId)) return false;
      if (!topics.includes("all") && !selectedTopicSet.has(q.topicId)) return false;

      if (statuses.includes("all")) return true;
      const p = progress[q.id];
      return statuses.some((status) => {
        if (status === "incorrect") return Boolean(p?.firstIncorrect || p?.directIncorrect);
        if (status === "correct") return Boolean(p?.directCorrect);
        if (status === "bookmark") return Boolean(p?.bookmarked);
        return true;
      });
    });

    const unique = Array.from(new Map(filtered.map((q) => [q.id, q])).values());
    const shuffled = [...unique].sort(() => Math.random() - 0.5).slice(0, questionCount);

    if (shuffled.length) {
      const params = new URLSearchParams();
      params.set("mode", "custom");
      params.set("ids", shuffled.map((q) => q.id).join(","));
      navigate(`/quiz/${examId}/custom?${params.toString()}`);
    }
    setCreating(false);
  };

  const subjectSummary = subjects.includes("all")
    ? "All subjects"
    : `${subjects.length} subject${subjects.length > 1 ? "s" : ""} selected`;
  const topicSummary = topics.includes("all")
    ? "All topics"
    : `${topics.length} topic${topics.length > 1 ? "s" : ""} selected`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to={`/pyqs/${exam}`} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200">
        <ArrowLeft size={16} /> {EXAMS.find((e) => e.id === examId)?.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Module</h1>
        <p className="mt-1 text-sm text-slate-500">Choose subjects, topics, status and question count.</p>
      </div>

      <div className="space-y-3">
        <MultiSelect label="Subject" summary={subjectSummary} open={subjectOpen} onToggle={() => setSubjectOpen((v) => !v)}>
          <SelectionList
            items={[{ id: "all", name: "All subjects" }, ...SUBJECTS.map((s) => ({ id: s.id, name: s.name }))]}
            selected={subjects}
            onToggle={toggleSubjects}
          />
        </MultiSelect>

        <MultiSelect label="Topic" summary={topicSummary} open={topicOpen} onToggle={() => setTopicOpen((v) => !v)}>
          <SelectionList
            items={[{ id: "all", name: "All topics" }, ...topicItems]}
            selected={topics}
            onToggle={toggleTopics}
          />
        </MultiSelect>
      </div>

      <div className="mt-4">
        <FilterBar value={statuses} onChange={setStatuses} />
      </div>

      <label className="mt-4 block rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <span className="block text-xs text-slate-500">Questions</span>
        <select
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="mt-2 w-full bg-transparent text-sm text-slate-100 outline-none"
        >
          {[10, 20, 30, 40, 50, 60, 80, 100].map((n) => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
        </select>
      </label>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
        {matchingCount} questions match the current filters.
        {matchingCount < questionCount && matchingCount > 0 && ` The module will contain ${matchingCount}.`}
      </div>

      <div className="sticky bottom-3 mt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#10161e]/95 p-3 shadow-soft backdrop-blur">
          <span className="flex-1 text-xs text-slate-500">
            {matchingCount === 0 ? "No questions available" : `${Math.min(matchingCount, questionCount)} questions`}
          </span>
          <button
            type="button"
            disabled={matchingCount === 0 || creating}
            onClick={() => void create()}
            className="rounded-xl bg-slate-100 px-5 py-3 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            CREATE MODULE
          </button>
        </div>
      </div>
    </main>
  );
}
