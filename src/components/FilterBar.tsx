import type { StatusFilter } from "../types";

export default function FilterBar({
  value,
  onChange
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  const items: Array<[StatusFilter, string]> = [
    ["all", "All"],
    ["incorrect", "Incorrect"],
    ["correct", "Correct"],
    ["bookmark", "Bookmark"]
  ];

  return (
    <div className="flex overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-1">
      {items.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`min-w-fit flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            value === id ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
