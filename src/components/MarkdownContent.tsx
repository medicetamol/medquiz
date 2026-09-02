import { Fragment } from "react";

function inlineParts(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-slate-800 px-1 py-0.5 text-[0.9em] text-slate-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    const image = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      return (
        <img
          key={index}
          src={image[2]}
          alt={image[1]}
          loading="lazy"
          className="max-h-[28rem] w-full rounded-xl object-contain"
        />
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 underline underline-offset-2"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export default function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={blocks.length} className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-6 text-slate-300">
          <code data-language={language || undefined}>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      const className =
        level === 1
          ? "text-lg font-bold text-slate-100"
          : level === 2
            ? "text-base font-bold text-slate-100"
            : "text-sm font-semibold text-slate-200";
      blocks.push(
        <Tag key={blocks.length} className={className}>
          {inlineParts(heading[2])}
        </Tag>
      );
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={blocks.length}
          className="border-l-2 border-slate-600 pl-3 text-sm italic leading-6 text-slate-300"
        >
          {inlineParts(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={blocks.length} className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-max text-left text-xs">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                {headers.map((cell, index) => (
                  <th key={index} className="px-3 py-2 font-semibold">{inlineParts(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-800">
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top text-slate-400">
                      {inlineParts(row[cellIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={blocks.length} className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
          {items.map((item, index) => <li key={index}>{inlineParts(item)}</li>)}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={blocks.length} className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-300">
          {items.map((item, index) => <li key={index}>{inlineParts(item)}</li>)}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("> ") &&
      !lines[i].trim().startsWith("```")
    ) {
      paragraph.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={blocks.length} className="text-sm leading-6 text-slate-300">
        {inlineParts(paragraph.join(" "))}
      </p>
    );
  }

  return <div className="space-y-4">{blocks}</div>;
}
