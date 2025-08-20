# NEET PG & INICET PYQs Quiz for Medicos

(React + Vite + Tailwind)

Mobile-first quiz app for practicing past-year questions by **subject** and **subtopic** with **timer**, **score review**, **bookmarking**, and **JSON import**.

## Quick Start

```bash
npm i
npm run dev
```

Build:
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages (recommended)

1. Create a GitHub repo, push this project.
2. In GitHub, go to **Settings → Pages → Build and deployment** and choose **GitHub Actions**.
3. Keep the included workflow `.github/workflows/deploy.yml` (it will build and publish to Pages on every push to `main`).

The site uses a relative `base` so it also works on any static host.

## Provide Questions via JSON

Put your bank at `public/questions.json` (or upload via the Import page).

**Schema**:
```json
{
  "meta": { "title": "Your Bank Title", "updated": "YYYY-MM-DD" },
  "items": [{
    "id": "unique-id",
    "exam": "NEET PG | INICET",
    "year": 2024,
    "subject": "Medicine",
    "subtopic": "Cardiology",
    "stem": "Question text...",
    "choices": [
      { "id": "A", "text": "Option A" },
      { "id": "B", "text": "Option B" }
    ],
    "answer": "A",
    "explanation": "Why A is correct",
    "difficulty": "Easy | Medium | Hard",
    "tags": ["cardio", "murmur"],
    "image": "optional-public-url.png"
  }]
}
```

Notes:
- You can add more choice options (E/F) if needed; just keep `answer` equal to a choice `id`.
- Unicode supported. Images should be public URLs if hosting on Pages.
- For big banks, split by subject and merge during build (future enhancement).

## Features

- Filter by subject / subtopic / exam
- Timer per question (default 60s)
- Progress bar and score summary
- Review page with correct vs selected answers and explanations
- Bookmark questions (stored locally)
- JSON Import/validator helper
- Responsive, clean UI with Tailwind

## Customize

- **Timer**: change default in `src/pages/Quiz.tsx` (`setTimeLeft(60)`).
- **Branding**: colors in `tailwind.config.js` and meta tags in `index.html`.
- **Routing**: `src/main.tsx` and pages in `src/pages/*`.

## License
MIT
