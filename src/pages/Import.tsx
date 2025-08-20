import { useState } from "react";
import type { Bank } from "../types";

export default function Import() {
  const [msg, setMsg] = useState<string>("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bank = JSON.parse(reader.result as string) as Bank;
        const blob = new Blob([JSON.stringify(bank, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "questions.json";
        a.click();
        setMsg(`Looks valid: ${bank.items?.length ?? 0} questions. A download started; replace public/questions.json in your repo with it.`);
      } catch (err: any) {
        setMsg("Invalid JSON: " + err?.message);
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Import/Validate Question Bank (JSON)</h2>
      <input type="file" accept="application/json" onChange={onFile} className="block" />
      <p className="text-sm text-purple-600">{msg}</p>
      <p className="text-xs text-slate-600">This page validates your JSON and lets you download a formatted questions.json to put in /public for quick hosting.</p>
    </div>
  );
}
