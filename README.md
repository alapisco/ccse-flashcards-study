# CCSE 2-26 Flashcards App

A mobile-first web application for studying CCSE 2-26 exam questions using Spaced Repetition (SRS). Built with React, TypeScript, and Vite.

The question bank is loaded at runtime from the repo-root `questions.json`.

## 🛠 Tech Stack

- **Core:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **State Management:** Zustand (w/ Persistence)
- **Logic:** ts-fsrs (Spaced Repetition Algorithm)
- **Testing:** Vitest, React Testing Library

## ✅ Features (v1)

- **Inicio**: overview + quick start
- **Estudio**: infinite “estudio inteligente” (prioritizes due → weak → new)
- **Practicar**: choose a tarea or browse the Banco
- **Simulacro**: official 25-question distribution (and an “inteligente” weighted option)
- **Más**: estadísticas, ajustes (export/import/reset)

| Feature | Official CCSE App | This App |
|---|---|---|
| Simulacro official shape | ✅ | ✅ |
| Spaced repetition scheduling | ❌ | ✅ (FSRS) |
| Weak question prioritization | ❌ | ✅ |
| Search question bank | limited/none | ✅ |
| Study focus by tarea | limited | ✅ |

## 🚀 Getting Started

### 1) Installation
Ensure you have Node.js installed (v18+ recommended).

```bash
# Install all dependencies
npm install
```

### 2) Development
Runs the app in development mode with Hot Module Replacement (HMR).

Open http://localhost:5173 to view it in the browser.

Open developer tools (F12) and toggle "Device Toolbar" to test mobile view.

```bash
npm run dev
```

### 3) Testing
Runs the test suite using Vitest.

```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch

# UI runner
npm run test:ui
```

### 4) Building for Production
Builds the app for deployment to static hosting (Vercel, Netlify, GitHub Pages). The output will be in the `dist/` folder.

```bash
npm run build
```

### 5) Previewing the Production Build
Serves the production build locally.

```bash
npm run preview
```

### 6) Linting
Checks the code for syntax errors and style issues.

```bash
# Check for linting errors
npm run lint
```

## 📂 Key Libraries Documentation

- Routing: [React Router](https://reactrouter.com/)
- State: [Zustand](https://zustand-demo.pmnd.rs/)
- SRS Math: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (used for calculating next review dates)
- Styling: [Tailwind CSS](https://tailwindcss.com/docs)

## 📦 Dataset

- The app loads [questions.json](questions.json) (repo root) at runtime.
- Canonical internal format + validation rules are documented in `DESIGN.md`.
- Note: `src/data/dataset.ts` is intentionally unused (historical artifact).

### Expected `questions.json` shape

Canonical (recommended) format:

```json
{
	"datasetVersion": "ccse-2-26",
	"tareas": [{"id": 1, "name": "..."}],
	"questions": [{
		"id": "1001",
		"question": "España es…",
		"options": [{"letter": "a", "text": "..."}],
		"answer": "a",
		"tareaId": 1,
		"type": "mcq"
	}]
}
```

Also supported:
- `datasetVersion` can be omitted (the app will assume `ccse-2-26`)
- `tasks` instead of `tareas`
- `taskId` instead of `tareaId`
- `type` can be omitted (it will be inferred: 2 options → `tf`, else `mcq`)

### Converting an existing dump

If your input uses `topics` and `topicId`, use:

```bash
python3 scripts/rename_dataset.py path/to/input.json path/to/output.json
```

Then replace the repo-root [questions.json](questions.json) with the generated output.

## 🔐 Environment files

- This project does not require env vars by default.
- If you add any, prefer committing a `.env.example` and keep real `.env*` files local (they are ignored by git).

## 📱 Mobile-First Tips
This app is designed to look like a native app.

Development is done using Tailwind utility classes.

Use clsx and tailwind-merge for conditional class logic.

## 🧠 “Estudio inteligente” algorithm

The intelligent study flow chooses the next question using these signals (in order):

- **Priority first**: if you start intelligent study with `priorityIds` (e.g., to review mistakes), those are served first.
- **Buckets**: otherwise, it prefers questions in this order: **due → weak → new → learning**.
- **Repeat avoidance (recent window)**: within each bucket, it tries to avoid questions you just saw by excluding a “recent” window of IDs.
	- The window size is **dynamic** based on the number of in-scope questions (all vs a single tarea): roughly **40% of the scope**, clamped to **[4..20]**, and never equal to the full scope.
	- If needed (tiny scope), it can fall back to allow repeats rather than getting stuck.
- **Same-day repeat avoidance (FSRS date granularity)**: scheduling is computed by FSRS (`ts-fsrs`), but the app stores review times as **local dates** (`YYYY-MM-DD`).
	- To reduce “I just answered this and it came back immediately” reports, items scheduled for **today** are treated as **not due** if they were **already seen today**.
