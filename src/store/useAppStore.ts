import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProgressById, QuestionProgress } from '../domain/progress'
import type { Dataset, TareaId } from '../domain/types'
import { gradeFromOutcome, nextCardState } from '../srs/engine'
import { todayLocal } from '../srs/date'
import { applyLeechDelta } from '../domain/weak'
import { getNextIntelligentQuestion, type IntelligentConstraint } from '../study/getNextIntelligentQuestion'

export type DefaultPreset = 'short' | 'medium' | 'long'

export type SettingsState = {
  defaultPreset: DefaultPreset
  requeueWrong: boolean
  focusTareaId: TareaId | 'all'
  onlyThisTarea: boolean
}

export type ActiveSessionKind = 'study' | 'simulacro' | 'targeted'

export type ActiveSession = {
  id: string
  kind: ActiveSessionKind
  ids: string[]
  plannedTotal: number
  currentIndex: number
  wrongIds: string[]
  correctById: Record<string, boolean>

  // optional metadata (used by simulacro)
  startedAt?: number
  durationSec?: number
}

export type SimulacroResult = {
  sessionId: string
  finishedAt: string
  total: number
  totalCorrect: number
  apto: boolean
  byTarea: Record<TareaId, { total: number; correct: number }>
  durationSec: number
  timeSpentSec: number
}

export type AppState = {
  settings: SettingsState
  progressById: ProgressById
  activeSession: ActiveSession | null
  simulacroHistory: SimulacroResult[]

  intelligent: {
    active: boolean
    constraint: IntelligentConstraint
    priorityIds: string[]
    currentId: string | null
    recentIds: string[]
    answered: number
    correct: number
  }

  setSettings: (partial: Partial<SettingsState>) => void
  resetProgress: () => void
  toggleManualWeak: (id: string) => void

  startIntelligent: (args: {
    dataset: Dataset
    constraint?: IntelligentConstraint
    priorityIds?: string[]
    today?: string
  }) => void
  recordIntelligentAnswer: (args: { questionId: string; correct: boolean }) => void
  nextIntelligent: (args: { dataset: Dataset; today?: string }) => void
  finishIntelligent: () => void

  startSession: (
    kind: ActiveSessionKind,
    ids: string[],
    meta?: {
      startedAt?: number
      durationSec?: number
    },
  ) => void
  answerInSession: (args: {
    dataset: Dataset
    questionId: string
    chosenLetter: string
    confidence: 'knew' | 'guessed'
    today?: string
  }) => { correct: boolean }
  nextInSession: (args: { requeueWrong?: boolean }) => void
  finishSession: () => void

  recordSimulacroResult: (result: SimulacroResult) => void

  exportPayload: () => unknown
  importPayload: (payload: unknown) => { ok: true } | { ok: false; reason: string }
}

const DEFAULT_SETTINGS: SettingsState = {
  defaultPreset: 'medium',
  requeueWrong: true,
  focusTareaId: 'all',
  onlyThisTarea: false,
}

const DEFAULT_INTELLIGENT: AppState['intelligent'] = {
  active: false,
  constraint: { kind: 'all' },
  priorityIds: [],
  currentId: null,
  recentIds: [],
  answered: 0,
  correct: 0,
}

function bumpProgress(args: {
  previous: QuestionProgress | undefined
  nowDate: Date
  outcome: 'wrong' | 'guessed' | 'knew'
}) {
  const { previous, nowDate, outcome } = args
  const nowDay = todayLocal()

  const grade = gradeFromOutcome(outcome)
  const next = nextCardState(previous?.card, nowDate, grade)

  const seenCount = (previous?.seenCount ?? 0) + 1
  const correctCount = (previous?.correctCount ?? 0) + (outcome === 'wrong' ? 0 : 1)
  const wrongCount = (previous?.wrongCount ?? 0) + (outcome === 'wrong' ? 1 : 0)
  const leechScore = applyLeechDelta(previous?.leechScore ?? 0, outcome)

  return {
    card: next.card,
    nextReviewAt: next.nextReviewAt,
    seenCount,
    correctCount,
    wrongCount,
    lastSeenAt: nowDay,
    lastWrongAt: outcome === 'wrong' ? nowDay : previous?.lastWrongAt,
    lastResult: outcome,
    leechScore,
    manualWeak: previous?.manualWeak ?? false,
  } satisfies QuestionProgress
}

function newSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `s_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      progressById: {},
      activeSession: null,
      simulacroHistory: [],
      intelligent: DEFAULT_INTELLIGENT,

      setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      resetProgress: () => set({ progressById: {}, activeSession: null, intelligent: DEFAULT_INTELLIGENT }),

      startIntelligent: ({ dataset, constraint, priorityIds, today }) => {
        const day = today ?? todayLocal()
        const nextId = getNextIntelligentQuestion({
          dataset,
          progressById: get().progressById,
          today: day,
          constraint: constraint ?? { kind: 'all' },
          recentIds: [],
          priorityIds: priorityIds ?? [],
        })

        set({
          intelligent: {
            active: true,
            constraint: constraint ?? { kind: 'all' },
            priorityIds: priorityIds ?? [],
            currentId: nextId,
            recentIds: nextId ? [nextId] : [],
            answered: 0,
            correct: 0,
          },
        })
      },

      recordIntelligentAnswer: ({ questionId, correct }) => {
        const state = get().intelligent
        if (!state.active) return
        set({
          intelligent: {
            ...state,
            answered: state.answered + 1,
            correct: state.correct + (correct ? 1 : 0),
            priorityIds: state.priorityIds.filter((id) => id !== questionId),
          },
        })
      },

      nextIntelligent: ({ dataset, today }) => {
        const day = today ?? todayLocal()
        const state = get().intelligent
        if (!state.active) return

        const nextId = getNextIntelligentQuestion({
          dataset,
          progressById: get().progressById,
          today: day,
          constraint: state.constraint,
          recentIds: state.recentIds,
          priorityIds: state.priorityIds,
        })

        set({
          intelligent: {
            ...state,
            currentId: nextId,
            recentIds: nextId ? [...state.recentIds, nextId].slice(-20) : state.recentIds,
          },
        })
      },

      finishIntelligent: () => set({ intelligent: DEFAULT_INTELLIGENT }),

      toggleManualWeak: (id) =>
        set((s) => {
          const previous = s.progressById[id]
          if (!previous) return s
          return {
            progressById: {
              ...s.progressById,
              [id]: { ...previous, manualWeak: !previous.manualWeak },
            },
          }
        }),

      startSession: (kind, ids, meta) =>
        set({
          activeSession: {
            id: newSessionId(),
            kind,
            ids,
            plannedTotal: ids.length,
            currentIndex: 0,
            wrongIds: [],
            correctById: {},
            startedAt: meta?.startedAt,
            durationSec: meta?.durationSec,
          },
        }),

      answerInSession: ({ dataset, questionId, chosenLetter, confidence }) => {
        const q = dataset.questions.find((qq) => qq.id === questionId)
        if (!q) return { correct: false }

        const correct = chosenLetter === q.answer
        const outcome: 'wrong' | 'guessed' | 'knew' = correct
          ? confidence === 'knew'
            ? 'knew'
            : 'guessed'
          : 'wrong'

        const now = new Date()

        set((s) => {
          const previous = s.progressById[questionId]
          const next = bumpProgress({ previous, nowDate: now, outcome })

          const session = s.activeSession
          if (!session) {
            return { progressById: { ...s.progressById, [questionId]: next } }
          }

          return {
            progressById: { ...s.progressById, [questionId]: next },
            activeSession: {
              ...session,
              correctById: { ...session.correctById, [questionId]: correct },
              wrongIds: correct
                ? session.wrongIds
                : session.wrongIds.includes(questionId)
                  ? session.wrongIds
                  : [...session.wrongIds, questionId],
            },
          }
        })

        return { correct }
      },

      nextInSession: ({ requeueWrong } = {}) =>
        set((s) => {
          const session = s.activeSession
          if (!session) return s

          const currentId = session.ids[session.currentIndex]
          const wasWrong = currentId ? !session.correctById[currentId] : false

          let ids = session.ids
          const plannedTotal = session.plannedTotal

          // Requeue wrong questions without increasing the session length.
          // We do this by inserting the current question later in the remaining window,
          // and dropping one item beyond the plannedTotal.
          if (requeueWrong && wasWrong && currentId) {
            const nextIndex = session.currentIndex + 1
            const alreadyQueuedLater = ids.slice(nextIndex, plannedTotal).includes(currentId)

            if (!alreadyQueuedLater && nextIndex < plannedTotal) {
              const insertAt = Math.min(plannedTotal - 1, session.currentIndex + 6)
              const copy = [...ids]
              copy.splice(insertAt, 0, currentId)

              // Keep the planned window fixed-size.
              if (copy.length > plannedTotal) {
                copy.splice(plannedTotal, copy.length - plannedTotal)
              }

              ids = copy
            }
          }

          const nextIndex = session.currentIndex + 1
          return { activeSession: { ...session, ids, currentIndex: nextIndex, plannedTotal } }
        }),

      finishSession: () => set({ activeSession: null }),

      recordSimulacroResult: (result) =>
        set((s) => {
          if (s.simulacroHistory.some((r) => r.sessionId === result.sessionId)) return s
          return { simulacroHistory: [result, ...s.simulacroHistory].slice(0, 30) }
        }),

      exportPayload: () => {
        const state = get()
        return {
          schemaVersion: 1,
          datasetVersion: 'ccse-2-26',
          createdAt: new Date().toISOString(),
          settings: state.settings,
          progressById: state.progressById,
        }
      },

      importPayload: (payload) => {
        if (!payload || typeof payload !== 'object') return { ok: false, reason: 'Invalid JSON' }

        const p = payload as Record<string, unknown>
        if (p.schemaVersion !== 1) return { ok: false, reason: 'Unsupported schemaVersion' }

        const progressById = p.progressById
        if (!progressById || typeof progressById !== 'object') {
          return { ok: false, reason: 'Missing progressById' }
        }

        const settings =
          p.settings && typeof p.settings === 'object'
            ? (p.settings as Partial<SettingsState>)
            : DEFAULT_SETTINGS

        set({
          settings: { ...DEFAULT_SETTINGS, ...settings },
          progressById: progressById as ProgressById,
          activeSession: null,
        })

        return { ok: true }
      },
    }),
    {
      name: 'ccse-flashcards-v1',
      partialize: (state) => ({ settings: state.settings, progressById: state.progressById }),
    },
  ),
)
