// scripts/generate-ai-pages.cjs
//
// Pre-renders a static HTML file for every question at dist/ai/<id>/index.html.
//
// Why this exists:
// /ai/:questionId is currently a client-side React Route (AIPrompt.tsx). GitHub
// Pages has no matching file for that path, so it serves 404.html with an
// actual HTTP 404 status. Browsers don't care and just run the JS, so the
// page "looks fine" to a human. But AI tools/fetchers that read raw HTTP
// generally treat a 404 status as "page not found" and stop, and even if
// they didn't, the raw markup is just an empty <div id="root"> with no
// content until JS runs.
//
// This script mirrors AIPrompt.tsx's rendering logic at build time so the
// exact same content ships as a plain, unindexed static file returning a
// real 200.
//
// Run AFTER `vite build` (needs dist/ to exist) and BEFORE create-404.cjs
// (order between those two doesn't matter, just needs dist/ present).

const fs = require("fs");
const path = require("path");

// Kept byte-for-byte identical to MASTER_PROMPT in src/pages/AIPrompt.tsx.
// If you edit the prompt there, mirror the change here too.
const MASTER_PROMPT = `You are a medical student in an entrance exam (NEET PG & INICET).

Solve the following MCQ using the approach described below.

1. One-line problem representation: age/sex + key symptom/sign + key discriminator(s).

2. Key clues only (max 3–5 bullets): highlight the discriminators; ignore fluff.

3. Solve the question using an elimination-first approach as if you do NOT know the correct answer. Do not answer according to any colour marked in the question. Justify every elimination using exam-relevant logic.

4. Stepwise elimination of options: eliminate options one by one with crisp reasons; include "why tempting but wrong" for close distractors.

Keep the response concise and focused on high-yield, exam-relevant points.

Use standard medical terminology.`;

const ROOT = process.cwd();
const PYQS_DIR = path.join(ROOT, "PYQs");
const OUT_DIR = path.join(ROOT, "dist", "ai");

// Same field mapping as parseQuestions() in src/data/questions.ts:
// CompactQuestion { id, y, t, q, o, a, image? } -> PYQQuestion
function expandQuestion(compact, exam, subjectId) {
  return {
    id: compact.id,
    exam,
    year: compact.y,
    subjectId,
    topicId: compact.t,
    topicName: compact.t,
    question: compact.q,
    options: compact.o,
    answer: compact.a,
    ...(compact.image ? { image: compact.image } : {}),
  };
}

// Same priority as getImageSrc() in src/pages/AIPrompt.tsx: imageSrc -> imageUrl -> image
function getImageSrc(question) {
  const src = question.imageSrc ?? question.imageUrl ?? question.image;
  return typeof src === "string" && src.trim() ? src.trim() : undefined;
}

// Same content assembly as AIPrompt.tsx's `content` array.
function buildContent(question) {
  const imageSrc = getImageSrc(question);

  const options = question.options
    .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
    .join("\n");

  return [
    "Use this prompt to solve the following MCQ.",
    "",
    MASTER_PROMPT,
    "",
    "MCQ",
    "",
    imageSrc ? `![Question image](${imageSrc})` : "",
    imageSrc ? "" : "",
    question.question,
    "",
    options,
  ].join("\n");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderPage(content) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex" />
<title>mediCetamol AI prompt</title>
</head>
<body>
<pre style="margin:0;padding:16px;white-space:pre-wrap;overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:14px;line-height:1.55;">${escapeHtml(
    content
  )}</pre>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(PYQS_DIR)) {
    console.error(`PYQs directory not found at ${PYQS_DIR}, skipping AI page generation.`);
    return;
  }

  if (!fs.existsSync(path.join(ROOT, "dist"))) {
    console.error("dist/ not found. Run `vite build` before this script.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const examDirs = fs
    .readdirSync(PYQS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  let count = 0;

  for (const examDir of examDirs) {
    const exam = examDir.name; // e.g. "NEET-PG", "INI-CET", "FMGE"
    const examPath = path.join(PYQS_DIR, exam);

    const subjectDirs = fs
      .readdirSync(examPath, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    for (const subjectDir of subjectDirs) {
      const subjectId = subjectDir.name;
      const questionsFile = path.join(examPath, subjectId, "questions.json");

      if (!fs.existsSync(questionsFile)) continue;

      let compactQuestions;
      try {
        compactQuestions = JSON.parse(fs.readFileSync(questionsFile, "utf8"));
      } catch (err) {
        console.error(`Skipping unparsable ${questionsFile}: ${err.message}`);
        continue;
      }

      for (const compact of compactQuestions) {
        if (!compact || !compact.id) continue;

        const question = expandQuestion(compact, exam, subjectId);
        const content = buildContent(question);
        const html = renderPage(content);

        const pageDir = path.join(OUT_DIR, question.id);
        fs.mkdirSync(pageDir, { recursive: true });
        fs.writeFileSync(path.join(pageDir, "index.html"), html);
        count++;
      }
    }
  }

  console.log(`Generated ${count} static /ai/:id pages in dist/ai/`);
}

main();
