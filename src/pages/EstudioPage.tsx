import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import type { IntelligentConstraint } from '../study/getNextIntelligentQuestion'

export function EstudioPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()

  const progressById = useAppStore((s) => s.progressById)
  const intelligent = useAppStore((s) => s.intelligent)
  const startIntelligent = useAppStore((s) => s.startIntelligent)
  const finishIntelligent = useAppStore((s) => s.finishIntelligent)
  const [confirmSwitch, setConfirmSwitch] = useState(false)

  const currentModeLabel = useMemo(() => {
    const constraint: IntelligentConstraint = intelligent.constraint
    if (constraint.kind === 'tarea') return `Tarea ${constraint.tareaId}`
    return 'Todas las preguntas'
  }, [intelligent.constraint])

  const desiredModeLabel = 'Todas las preguntas'

  const onStartInteligente = () => {
    if (!dataset) return

    const switching = intelligent.active && intelligent.constraint.kind !== 'all'
    if (switching) {
      setConfirmSwitch(true)
      return
    }

    if (!intelligent.active) {
      startIntelligent({ dataset, constraint: { kind: 'all' } })
    }

    navigate('/estudio/sesion')
  }

  if (intelligent.active) {
    return <Navigate to="/estudio/sesion" replace />
  }

  if (!dataset) {
    return <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Cargando preguntas…</div>
  }

  const seen = Object.keys(progressById).length

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Estudio inteligente</div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--ic-accent) 14%, white)',
              border: '1px solid color-mix(in srgb, var(--ic-accent) 26%, white)',
              color: 'var(--ic-accent)',
            }}
          >
            Recomendado
          </span>
        </div>
        <div className="mt-2 text-xs text-[var(--muted)]">Mezcla repasos y nuevas automáticamente. Se adapta a ti.</div>
        <div className="mt-4">
          <Button variant="primary" onClick={onStartInteligente}>
            {seen > 0 ? 'Continuar' : 'Empezar'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Apuntes CCSE</div>
        <div className="mt-2 text-xs text-[var(--muted)]">
          Resumen por tareas: solo lo imprescindible para contestar las preguntas.
        </div>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate('/apuntes')}>
            Abrir apuntes
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Estudio por tarea</div>
        <div className="mt-2 text-xs text-[var(--muted)]">Elige una tarea y refuerza tus puntos débiles dentro de ella.</div>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate('/estudio/tareas')}>
            Elegir tarea
          </Button>
        </div>
      </div>

      <ConfirmSheet
        open={confirmSwitch}
        title="Cambiar sesión"
        description={`Tienes una sesión en curso: ${currentModeLabel}. Si continúas, se interrumpirá y empezarás otra: ${desiredModeLabel}.`}
        confirmLabel="Interrumpir y continuar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmSwitch(false)}
        onConfirm={() => {
          if (!dataset) return
          setConfirmSwitch(false)
          finishIntelligent()
          startIntelligent({ dataset, constraint: { kind: 'all' } })
          navigate('/estudio/sesion')
        }}
      />
    </div>
  )
}
