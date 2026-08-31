import { ArrowLeft, Play } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EXAMS, getSubject, SAMPLE_TOPIC } from "../constants";
import { loadQuestions } from "../data/questions";
import EmptyState from "../components/EmptyState";
import { useMemo, useState } from "react";

export default function Subject() {
  const { exam, subjectId } = useParams();
  const subject = getSubject(subjectId ?? "");
  const examId = exam as "NEET-PG" | "INI-CET" | "FMGE";
  const questions = useMemo(() => loadQuestions(examId, subjectId ?? ""), [examId, subjectId]);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  if (!subject) return null;

  const topics = Array.from(
    new Map(questions.map((q) => [q.topicId, q.topicName ?? q.topicId])).entries()
  );

  const filtered = selectedTopic === "all"
    ? questions
    : questions.filter((q) => q.topicId === selectedTopic);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to={`/pyqs/${exam}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200"
      >
        <ArrowLeft size={16} /> {EXAMS.find((e) => e.id === examId)?.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{subject.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{questions.length} PYQ{questions.length === 1 ? "" : "s"}</p>
      </div>

      {questions.length === 0 ? (
        <EmptyState subject={subject.name} />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopic("all")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectedTopic === "all" ? "bg-slate-100 text-slate-950" : "bg-slate-800 text-slate-300"}`}
              >
                All topics
              </button>
              {topics.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setSelectedTopic(id)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectedTopic === id ? "bg-slate-100 text-slate-950" : "bg-slate-800 text-slate-300"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
            <span className="text-sm text-slate-400">{filtered.length} question{filtered.length === 1 ? "" : "s"} selected</span>
            <Link
              to={`/quiz/${exam}/${subjectId}?mode=direct&topic=${selectedTopic}`}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-950"
            >
              <Play size={15} /> Start
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
