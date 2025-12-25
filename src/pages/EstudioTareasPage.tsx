import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useDataset } from '../data/datasetContext'
import { isDue, isMastered } from '../domain/status'
import { isWeak } from '../domain/weak'
import { todayLocal } from '../srs/date'
import { useAppStore } from '../store/useAppStore'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import { TareaChip } from '../ui/StudyQuestionCard'
import type { IntelligentConstraint } from '../study/getNextIntelligentQuestion'

export function EstudioTareasPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()

  const progressById = useAppStore((s) => s.progressById)
  const intelligent = useAppStore((s) => s.intelligent)
  const startIntelligent = useAppStore((s) => s.startIntelligent)
  const finishIntelligent = useAppStore((s) => s.finishIntelligent)

  const [confirmSwitch, setConfirmSwitch] = useState<null | { tareaId: 1 | 2 | 3 | 4 | 5; tareaName: string }>(null)

  const today = todayLocal()

  const currentModeLabel = useMemo(() => {
    const constraint: IntelligentConstraint = intelligent.constraint
    if (constraint.kind === 'tarea') return `Tarea ${constraint.tareaId}`
    return 'Todas las preguntas'
  }, [intelligent.constraint])

  if (!dataset) {
    return <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Cargando preguntas…</div>
  }

  const startForTarea = (tareaId: 1 | 2 | 3 | 4 | 5, tareaName: string) => {
    const desiredConstraint: IntelligentConstraint = { kind: 'tarea', tareaId }

    const sameConstraint =
      intelligent.active &&
      intelligent.constraint.kind === 'tarea' &&
      (intelligent.constraint as Extract<IntelligentConstraint, { kind: 'tarea' }>).tareaId === tareaId

    if (intelligent.active && sameConstraint) {
      navigate('/estudio/sesion')
      return
    }

    if (intelligent.active && !sameConstraint) {
      setConfirmSwitch({ tareaId, tareaName })
      return
    }

    startIntelligent({ dataset, constraint: desiredConstraint })
    navigate('/estudio/sesion')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Estudio por tarea</div>
        <div className="mt-1 text-xs text-[var(--muted)]">Elige una tarea y refuerza tus puntos débiles.</div>
        <button type="button" className="mt-3 text-sm text-[var(--ic-accent)] underline" onClick={() => navigate('/estudio')}>
          Volver
        </button>
      </div>

      {dataset.tareas.map((t) => {
        const tareaQuestions = dataset.questions.filter((q) => q.tareaId === t.id)
        const total = tareaQuestions.length
        const seen = tareaQuestions.filter((q) => Boolean(progressById[q.id])).length
        const due = tareaQuestions.filter((q) => {
          const p = progressById[q.id]
          return p ? isDue(p.nextReviewAt, today, p.lastSeenAt) : false
        }).length
        const weak = tareaQuestions.filter((q) => {
          const p = progressById[q.id]
          return p ? isWeak(p, today) : false
        }).length
        const mastered = tareaQuestions.filter((q) => isMastered(progressById[q.id])).length

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => startForTarea(t.id, t.name)}
            className="w-full rounded-2xl bg-[var(--surface)] p-4 text-left active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Tarea {t.id}</div>
                <div className="mt-2">
                  <TareaChip tareaId={t.id} name={t.name} wrap />
                </div>
              </div>
              <div className="shrink-0 pt-0.5 text-[var(--muted)]" aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <StatChip label="Avance" value={`${seen}/${total}`} />
              <StatChip label="Para repasar" value={due} />
              <StatChip label="Para reforzar" value={weak} />
              <StatChip label="Bien aprendidas" value={mastered} />
            </div>
          </button>
        )
      })}

      <ConfirmSheet
        open={Boolean(confirmSwitch)}
        title="Cambiar sesión"
        description={
          confirmSwitch
            ? `Tienes una sesión en curso: ${currentModeLabel}. Si continúas, se interrumpirá y empezarás otra: ${confirmSwitch.tareaName}.`
            : ''
        }
        confirmLabel="Interrumpir y empezar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmSwitch(null)}
        onConfirm={() => {
          if (!dataset || !confirmSwitch) return
          const desiredConstraint: IntelligentConstraint = { kind: 'tarea', tareaId: confirmSwitch.tareaId }
          setConfirmSwitch(null)
          finishIntelligent()
          startIntelligent({ dataset, constraint: desiredConstraint })
          navigate('/estudio/sesion')
        }}
      />
    </div>
  )
}

function StatChip(props: { label: string; value: number | string }) {
  return (
    <span className="rounded-2xl bg-white px-3 py-2">
      <div className="text-xs text-[var(--muted)]">{props.label}</div>
      <div className="text-sm font-semibold">{props.value}</div>
    </span>
  )
}
