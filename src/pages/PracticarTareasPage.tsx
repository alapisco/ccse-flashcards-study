import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'
import type { TareaId } from '../domain/types'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import type { IntelligentConstraint } from '../study/getNextIntelligentQuestion'

export function PracticarTareasPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const startIntelligent = useAppStore((s) => s.startIntelligent)
  const finishIntelligent = useAppStore((s) => s.finishIntelligent)
  const intelligent = useAppStore((s) => s.intelligent)

  const [tarea, setTarea] = useState<TareaId>(1)
  const [confirmSwitch, setConfirmSwitch] = useState(false)

  if (!dataset) {
    return <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Cargando…</div>
  }

  const tareaMeta = dataset.tareas.find((t) => t.id === tarea)
  const tareaName = tareaMeta?.name ?? `Tarea ${tarea}`
  const labelFor = (id: TareaId) => {
    const meta = dataset.tareas.find((t) => t.id === id)
    const name = meta?.name
    return name ? `Tarea ${id} · ${name}` : `Tarea ${id}`
  }

  const desiredConstraint = { kind: 'tarea' as const, tareaId: tarea }
  const desiredModeLabel = `Tarea ${tarea} · ${tareaName}`
  const currentModeLabel =
    ((): string => {
      const constraint: IntelligentConstraint = intelligent.constraint
      if (constraint.kind === 'tarea') {
        const tareaConstraint = constraint as Extract<IntelligentConstraint, { kind: 'tarea' }>
        const meta = dataset.tareas.find((t) => t.id === tareaConstraint.tareaId)
          const name = meta?.name
        return name ? `Tarea ${tareaConstraint.tareaId} · ${name}` : `Tarea ${tareaConstraint.tareaId}`
      }
      return 'Todas las preguntas'
    })()

  const sameConstraint = (() => {
    const constraint: IntelligentConstraint = intelligent.constraint
    if (constraint.kind !== 'tarea') return false
    const tareaConstraint = constraint as Extract<IntelligentConstraint, { kind: 'tarea' }>
    return tareaConstraint.tareaId === desiredConstraint.tareaId
  })()

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{tareaName}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">Elige una tarea para practicar</div>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs">Tarea {tarea}</span>
        </div>

        <select
          value={String(tarea)}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) setTarea(n)
          }}
          className="mt-3 w-full truncate rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-ellipsis whitespace-nowrap"
        >
          <option value="1">{labelFor(1)}</option>
          <option value="2">{labelFor(2)}</option>
          <option value="3">{labelFor(3)}</option>
          <option value="4">{labelFor(4)}</option>
          <option value="5">{labelFor(5)}</option>
        </select>

        <div className="mt-3">
          <Button
            variant="primary"
            onClick={() => {
              if (intelligent.active && sameConstraint) {
                navigate('/estudio/sesion')
                return
              }

              if (intelligent.active && !sameConstraint) {
                setConfirmSwitch(true)
                return
              }

              startIntelligent({ dataset, constraint: desiredConstraint })
              navigate('/estudio/sesion')
            }}
          >
            Practicar esta tarea
          </Button>
          <div className="mt-2 text-xs text-[var(--muted)]">
            Priorizaremos repasos y fallos dentro de esta tarea.
          </div>
        </div>
      </div>

      <ConfirmSheet
        open={confirmSwitch}
        title="Cambiar sesión"
        description={`Tienes una sesión en curso: ${currentModeLabel}. Si continúas, se interrumpirá y empezarás otra: ${desiredModeLabel}.`}
        confirmLabel="Interrumpir y practicar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmSwitch(false)}
        onConfirm={() => {
          setConfirmSwitch(false)
          finishIntelligent()
          startIntelligent({ dataset, constraint: desiredConstraint })
          navigate('/estudio/sesion')
        }}
      />
    </div>
  )
}
