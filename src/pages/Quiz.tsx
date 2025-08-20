import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Bank, QAItem } from "../types";
import { storage } from "../lib/storage";

const SHUFFLE = (arr: any[]) => arr.map(v => [Math.random(), v]).sort((a,b) => a[0]-b[0]).map(([,v]) => v);

export default function Quiz() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30); // seconds per question
  const [bookmarks, setBookmarks] = useState<string[]>(storage.get("bookmarks", []));

  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/questions.json").then(r => r.json()).then(setBank).catch(() => {});
  }, []);

  const list: QAItem[] = useMemo(() => {
    const subject = params.get("subject") ?? "All";
    const subtopic = params.get("subtopic") ?? "All";
    const exam = params.get("exam") ?? "All";
    const filtered = bank?.items.filter(i =>
      (subject === "All" || i.subject === subject) &&
      (subtopic === "All" || i.subtopic === subtopic) &&
      (exam === "All" || i.exam === exam)
    ) ?? [];
    return SHUFFLE(filtered);
  }, [bank, params]);

  useEffect(() => { setTimeLeft(60); }, [qIndex]); // reset timer per question
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const current = list[qIndex];
  const chosen = current ? answers[current.id] : undefined;
  const progress = list.length ? Math.round((qIndex + 1) / list.length * 100) : 0;

  function selectAns(id: string) {
    if (!current) return;
    setAnswers(a => ({ ...a, [current.id]: id }));
  }
  function next() {
    if (qIndex + 1 < list.length) setQIndex(qIndex + 1);
    else navigate("/review", { state: { list, answers } });
  }
  function toggleBookmark() {
    if (!current) return;
    setBookmarks(b => {
      const has = b.includes(current.id);
      const next = has ? b.filter(x => x !== current.id) : [...b, current.id];
      storage.set("bookmarks", next);
      return next;
    });
  }

  if (!current) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-purple-500">{qIndex + 1}/{list.length}</div>
        <div className={`text-sm font-semibold ${timeLeft <= 5 ? "text-red-500" : "text-purple-600"}`}>⏱ {timeLeft}s</div>
      </div>
      <div className="w-full bg-purple-100 rounded-full h-2">
        <div className="bg-brand h-2 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="flex justify-between items-start gap-2">
          <h2 className="font-semibold text-lg">{current.stem}</h2>
          <button onClick={toggleBookmark} className={`text-xs px-3 py-1 rounded-2xl border ${bookmarks.includes(current.id) ? "bg-yellow-100 border-yellow-300" : ""}`}>
            {bookmarks.includes(current.id) ? "★ Saved" : "☆ Save"}
          </button>
        </div>
        {current.image && <img src={current.image} alt="" className="mt-3 rounded-xl max-h-72 object-contain" />}
        <div className="mt-3 space-y-2">
          {current.choices.map(c => (
            <button
              key={c.id}
              onClick={() => selectAns(c.id)}
              className={`w-full text-left px-4 py-3 rounded-2xl border
                ${chosen === c.id ? "border-brand bg-purple-50" : "hover:bg-purple-50"}`}
            >
              <span className="font-semibold mr-2">{c.id}.</span>{c.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => setQIndex(i => Math.max(0, i - 1))} className="px-4 py-2 rounded-2xl border">Back</button>
        <button onClick={next} className="px-6 py-2 rounded-2xl bg-brand text-white">{qIndex + 1 < list.length ? "Next" : "Finish"}</button>
      </div>
    </div>
  );
}
