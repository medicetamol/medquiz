import { Activity, BarChart3, CheckCircle2, Flame, Target, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAllQuestionProgress, getDailyActivity } from "../lib/db";
import { SUBJECTS } from "../constants";
import { getAllQuestions } from "../data/questions";
import type { DailyActivity, QuestionProgress } from "../types";

const EXAMS = ["NEET-PG", "INI-CET", "FMGE"] as const;

export default function Progress() {
  const [progress, setProgress] = useState<QuestionProgress[]>([]);
  const [activity, setActivity] = useState<DailyActivity[]>([]);

  useEffect(() => {
    Promise.all([getAllQuestionProgress(), getDailyActivity()]).then(([p, a]) => {
      setProgress(p);
      setActivity(a);
    });
  }, []);

  const directAttempts = progress.reduce((n, p) => n + p.attempts, 0);
  const correct = progress.reduce((n, p) => n + p.correctAttempts, 0);
  const incorrect = progress.reduce((n, p) => n + p.incorrectAttempts, 0);
  const bookmarks = progress.filter((p) => p.bookmarked).length;
  const accuracy = directAttempts ? Math.round((correct / directAttempts) * 100) : 0;

  const streak = useMemo(() => {
    const days = new Set(activity.filter((a) => a.questions > 0).map((a) => a.date));
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (!days.has(key)) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [activity]);

  const questionMap = useMemo(() => {
    const map = new Map<string, { subjectId: string }>();
    for (const exam of EXAMS) {
      for (const q of getAllQuestions(exam)) map.set(q.id, q);
    }
    return map;
  }, []);

  const subjectStats = SUBJECTS.map((subject) => {
    const ids = new Set(
      [...questionMap.entries()]
        .filter(([, q]) => q.subjectId === subject.id)
        .map(([id]) => id)
    );
    const rows = progress.filter((p) => ids.has(p.qid));
    const attempts = rows.reduce((n, p) => n + p.attempts, 0);
    const c = rows.reduce((n, p) => n + p.correctAttempts, 0);
    return {
      ...subject,
      attempts,
      correct: c,
      accuracy: attempts ? Math.round((c / attempts) * 100) : null
    };
  }).filter((s) => s.attempts > 0).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const weekly = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return activity.find((a) => a.date === key) ?? { date: key, questions: 0, correct: 0, incorrect: 0 };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="mt-1 text-sm text-slate-500">Your direct QBank performance and activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={Activity} label="Questions" value={directAttempts} />
        <Metric icon={CheckCircle2} label="Correct" value={correct} />
        <Metric icon={Target} label="Accuracy" value={`${accuracy}%`} />
        <Metric icon={Flame} label="Streak" value={`${streak}d`} />
      </div>

      <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">This week</h2>
            <p className="mt-1 text-xs text-slate-500">PYQs solved per day</p>
          </div>
          <BarChart3 size={19} className="text-slate-500" />
        </div>

        <div className="mt-6 flex h-36 items-end gap-2">
          {weekly.map((day) => {
            const max = Math.max(1, ...weekly.map((x) => x.questions));
            const height = Math.max(5, (day.questions / max) * 100);
            return (
              <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] text-slate-500">{day.questions || ""}</span>
                <div className="w-full rounded-t-md bg-slate-700" style={{ height: `${height}%` }} />
                <span className="text-[9px] text-slate-600">{day.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="font-bold">Performance</h2>
          <div className="mt-4 space-y-3">
            <Row icon={CheckCircle2} label="Correct attempts" value={correct} />
            <Row icon={XCircle} label="Incorrect attempts" value={incorrect} />
            <Row icon={Target} label="Bookmarks" value={bookmarks} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="font-bold">Subjects</h2>
          {subjectStats.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Subject-level performance will appear after you solve PYQs directly from the QBank.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {subjectStats.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-950 p-3">
                  <span className="flex-1 text-sm text-slate-300">{s.name}</span>
                  <span className="text-xs text-slate-500">{s.attempts} Q</span>
                  <b className="text-xs">{s.accuracy}%</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <Icon size={18} className="text-slate-500" />
      <p className="mt-4 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-950 p-3">
      <Icon size={17} className="text-slate-500" />
      <span className="flex-1 text-sm text-slate-400">{label}</span>
      <b className="text-sm">{value}</b>
    </div>
  );
}
