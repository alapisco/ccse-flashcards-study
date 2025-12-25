# CCSE 2026 Flashcards App

A mobile-first web application for studying CCSE 2026 exam questions using Spaced Repetition (SRS). Built with React, TypeScript, and Vite.

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

### 5) Linting & Formatting
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

### Expected `questions.json` shape

The loader accepts either Spanish or English-ish keys:

```json
{
	"tasks": [{"id": 1, "name": "..."}],
	"questions": [{
		"id": "1001",
		"question": "España es…",
		"options": [{"letter": "a", "text": "..."}],
		"answer": "a",
		"taskId": 1,
		"type": "mcq"
	}]
}
```

Also supported:
- `tareas` instead of `tasks`
- `tareaId` instead of `taskId`
- `type` can be omitted (it will be inferred: 2 options → `tf`, else `mcq`)

### Converting an existing dump

If your input uses `topics` and `topicId`, use:

```bash
python3 scripts/rename_dataset.py path/to/input.json path/to/output.json
```

Then replace the repo-root [questions.json](questions.json) with the generated output.

## 📱 Mobile-First Tips
This app is designed to look like a native app.

Development is done using Tailwind utility classes.

Use clsx and tailwind-merge for conditional class logic.