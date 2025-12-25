import { useMemo } from 'react'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { todayLocal } from '../srs/date'
import { computeMasteredCount } from '../domain/level'

export function EstadisticasPage() {
  const { dataset } = useDataset()
  const progressById = useAppStore((s) => s.progressById)
  const simulacroHistory = useAppStore((s) => s.simulacroHistory)
  const today = todayLocal()

  const stats = useMemo(() => {
    if (!dataset) return null
    const total = dataset.questions.length
    const seen = Object.keys(progressById).length
    const mastered = computeMasteredCount({ dataset, progressById, today })

    let totalSeen = 0
    let totalCorrect = 0
    for (const p of Object.values(progressById)) {
      totalSeen += p.seenCount ?? 0
      totalCorrect += p.correctCount ?? 0
    }
    const accuracy = totalSeen === 0 ? 0 : Math.round((totalCorrect / totalSeen) * 100)

    return { total, seen, mastered, accuracy }
  }, [dataset, progressById, today])

  if (!dataset || !stats) {
    return <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Cargando…</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Estadísticas</div>
        <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
          <div>Vistas: {stats.seen}/{stats.total}</div>
          <div>Bien aprendidas: {stats.mastered}/{stats.total}</div>
          <div>Precisión: {stats.accuracy}%</div>
        </div>
      </div>

      {simulacroHistory.length > 0 ? (
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <div className="text-sm font-semibold">Simulacros</div>
          <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
            {simulacroHistory.slice(0, 3).map((r) => (
              <div key={r.sessionId} className="flex items-center justify-between gap-3">
                <div className="truncate">{new Date(r.finishedAt).toLocaleString()}</div>
                <div className={r.apto ? 'shrink-0 font-semibold text-green-700' : 'shrink-0 font-semibold text-red-700'}>
                  {r.totalCorrect}/{r.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
