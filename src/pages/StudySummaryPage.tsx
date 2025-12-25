import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'

export function StudySummaryPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const session = useAppStore((s) => s.activeSession)
  const finishSession = useAppStore((s) => s.finishSession)
  const startSession = useAppStore((s) => s.startSession)

  const summary = useMemo(() => {
    if (!session || !dataset) return null
    const total = session.ids.length
    const correct = Object.values(session.correctById).filter(Boolean).length
    const byTarea: Record<number, { correct: number; total: number }> = {}

    for (const id of session.ids) {
      const q = dataset.questions.find((qq) => qq.id === id)
      if (!q) continue
      byTarea[q.tareaId] ??= { correct: 0, total: 0 }
      byTarea[q.tareaId].total += 1
      if (session.correctById[id]) byTarea[q.tareaId].correct += 1
    }

    return { total, correct, byTarea, wrongIds: session.wrongIds }
  }, [dataset, session])

  if (!dataset) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">Cargando preguntas…</div>
        <Button onClick={() => navigate('/estudiar')}>Volver</Button>
      </div>
    )
  }

  if (!session || !summary) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">No hay resumen disponible.</div>
        <Button onClick={() => navigate('/estudiar')}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Resumen</div>
        <div className="mt-1 text-2xl font-semibold">
          {summary.correct}/{summary.total}
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Por tarea</div>
        <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
          {[1, 2, 3, 4, 5].map((t) => {
            const row = summary.byTarea[t]
            if (!row) return null
            return (
              <div key={t} className="flex items-center justify-between">
                <span>Tarea {t}</span>
                <span>
                  {row.correct}/{row.total}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {summary.wrongIds.length > 0 ? (
        <Button
          variant="primary"
          onClick={() => {
            startSession('targeted', summary.wrongIds)
            navigate('/estudiar/sesion')
          }}
        >
          Repasar fallos ({summary.wrongIds.length})
        </Button>
      ) : null}

      <Button
        onClick={() => {
          finishSession()
          navigate('/estudiar')
        }}
      >
        Volver
      </Button>
    </div>
  )
}
