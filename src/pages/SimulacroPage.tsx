import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { todayLocal } from '../srs/date'
import { buildSimulacro } from '../simulacro/buildSimulacro'
import { Button } from '../ui/Button'

export function SimulacroPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const progressById = useAppStore((s) => s.progressById)
  const startSession = useAppStore((s) => s.startSession)
  const today = todayLocal()

  const canBuild = useMemo(() => {
    if (!dataset) return false
    const safe = () => {
      try {
        buildSimulacro({ dataset, progressById, today, type: 'oficial' })
        return true
      } catch {
        return false
      }
    }
    return safe()
  }, [dataset, progressById, today])

  const onStart = () => {
    if (!dataset) return
    const built = buildSimulacro({ dataset, progressById, today, type: 'oficial' })
    startSession('simulacro', built.ids, { startedAt: Date.now(), durationSec: 45 * 60 })
    navigate('/simulacro/run')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Simulacro oficial</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          Simula el examen oficial: 25 preguntas, 45 minutos y reparto oficial por tareas.
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={onStart} disabled={!canBuild}>
            Empezar
          </Button>
        </div>
      </div>

      {!canBuild ? (
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          {dataset ? 'Dataset incompleto para crear un simulacro.' : 'Cargando preguntas…'}
        </div>
      ) : null}
    </div>
  )
}
