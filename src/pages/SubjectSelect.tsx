import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { SUBJECTS, EXAMS } from "../constants";
import { getAllQuestions } from "../data/questions";
import EmptyState from "../components/EmptyState";

export default function SubjectSelect() {
  const { exam } = useParams<{ exam: "NEET-PG" | "INI-CET" | "FMGE" }>();
  const examId = exam && EXAMS.some((x) => x.id === exam) ? exam : "NEET-PG";
  const currentExam = EXAMS.find((x) => x.id === examId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/pyqs" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200">
        <ArrowLeft size={16} /> Exams
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold">{currentExam?.name ?? "PYQs"}</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a subject.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {SUBJECTS.map((subject) => {
          const count = getAllQuestions(examId).filter((q) => q.subjectId === subject.id).length;
          return (
            <Link
              key={subject.id}
              to={`/pyqs/${examId}/${subject.id}`}
              className="group min-h-28 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-600"
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold leading-5">{subject.name}</span>
                  <ArrowRight size={15} className="mt-0.5 shrink-0 text-slate-700 group-hover:text-slate-300" />
                </div>
                <span className="mt-4 text-xs text-slate-500">{count} PYQ{count === 1 ? "" : "s"}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <Link
          to={`/module/${examId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          Create custom module
        </Link>
      </div>

    </main>
  );
}
