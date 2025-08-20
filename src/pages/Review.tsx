import { useLocation, useNavigate } from "react-router-dom";
import type { QAItem } from "../types";

function score(list: QAItem[], answers: Record<string,string>) {
  const total = list.length;
  const correct = list.filter(q => answers[q.id] === q.answer).length;
  return { total, correct, percent: total ? Math.round(correct/total*100) : 0 };
}

export default function Review() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const list = (loc?.state?.list ?? []) as QAItem[];
  const answers = (loc?.state?.answers ?? {}) as Record<string,string>;
  const sc = score(list, answers);

  if (!list.length) return (
    <div className="text-center space-y-4">
      <p>No quiz data. Start a quiz first.</p>
      <button onClick={() => nav("/")} className="px-4 py-2 bg-brand text-white rounded-2xl">Back to Home</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border">
        <h2 className="text-xl font-bold">Your Score</h2>
        <p className="text-3xl font-extrabold mt-2">{sc.correct}/{sc.total} ({sc.percent}%)</p>
        <button onClick={() => nav("/")} className="mt-4 px-4 py-2 bg-brand text-white rounded-2xl">Back to Home</button>
      </div>

      <div className="space-y-4">
        {list.map(q => {
          const chosen = answers[q.id];
          const isCorrect = chosen === q.answer;
          return (
            <div key={q.id} className={`bg-white rounded-2xl p-4 border ${isCorrect ? "border-green-300" : "border-red-300"}`}>
              <div className="text-xs text-purple-500">{q.exam} · {q.subject}{q.subtopic ? " · " + q.subtopic : ""}</div>
              <h3 className="font-semibold mt-1">{q.stem}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {q.choices.map(c => (
                  <li key={c.id} className={`px-3 py-2 rounded-xl border ${c.id === q.answer ? "bg-green-50 border-green-200" : c.id === chosen ? "bg-red-50 border-red-200" : ""}`}>
                    <span className="font-semibold mr-2">{c.id}.</span>{c.text}
                  </li>
                ))}
              </ul>
              {q.explanation && <p className="mt-3 text-sm text-slate-700"><span className="font-semibold">Explanation:</span> {q.explanation}</p>}
            </div>
          )
        })}
      </div>
    </div>
  );
}
