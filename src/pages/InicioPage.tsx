import { useState } from 'react'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { todayLocal } from '../srs/date'
import { Button } from '../ui/Button'
import { isWeak } from '../domain/weak'
import { isDue } from '../domain/status'
import { Link, useNavigate } from 'react-router-dom'
import { computeLevel } from '../domain/level'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import { useOverlayEffects } from '../ui/useOverlayEffects'
import { ModalPortal } from '../ui/ModalPortal'
import type { IntelligentConstraint } from '../study/getNextIntelligentQuestion'

export function InicioPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const progressById = useAppStore((s) => s.progressById)
  const intelligent = useAppStore((s) => s.intelligent)
  const startIntelligent = useAppStore((s) => s.startIntelligent)
  const finishIntelligent = useAppStore((s) => s.finishIntelligent)
  const [showHow, setShowHow] = useState(false)
  const [confirmSwitch, setConfirmSwitch] = useState(false)

  useOverlayEffects(showHow || confirmSwitch)

  const today = todayLocal()

  const currentModeLabel = (() => {
    const constraint: IntelligentConstraint = intelligent.constraint
    if (constraint.kind === 'tarea') {
      const tareaConstraint = constraint as Extract<IntelligentConstraint, { kind: 'tarea' }>
      return `Tarea ${tareaConstraint.tareaId}`
    }
    return 'Todas las preguntas'
  })()

  const desiredModeLabel = 'Todas las preguntas'

  const onStart = () => {
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

  if (!dataset) {
    return <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Cargando preguntas…</div>
  }

  const total = dataset.questions.length
  const seen = Object.keys(progressById).length

  const dueCount = dataset.questions.filter((q) => {
    const p = progressById[q.id]
    return p ? isDue(p.nextReviewAt, today, p.lastSeenAt) : false
  }).length

  const weakCount = dataset.questions.filter((q) => {
    const p = progressById[q.id]
    // Include “fallé/lo adiviné” even if the item is also due today.
    // Users expect this count to update right after a mistake.
    return p ? isWeak(p, today) : false
  }).length

  const newCount = dataset.questions.filter((q) => !progressById[q.id]).length

  const level = computeLevel({ dataset, progressById, today })

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Tu nivel</div>
          <button type="button" className="text-xs text-[var(--muted)] underline" onClick={() => setShowHow(true)}>
            ¿Cómo funciona el nivel?
          </button>
        </div>
        <div className="mt-2 text-3xl font-semibold">{level.level}</div>
        <div className="mt-2 text-sm text-[var(--muted)]">{level.subtitle}</div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Tus preguntas</div>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Chip label="Para repasar" value={dueCount} />
          <Chip label="Para reforzar" value={weakCount} />
          <Chip label="Nuevas" value={newCount} />
        </div>

        <div className="mt-3 rounded-2xl bg-white px-3 py-3" aria-label={`Avance: ${seen} de ${total} vistas`}>
          <div className="flex items-baseline justify-between">
            <div className="text-xs text-[var(--muted)]">Avance</div>
            <div className="text-sm font-semibold">
              {seen}/{total}
            </div>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[var(--surface)]">
            <div
              className="h-2 rounded-full bg-[var(--ic-accent)]"
              style={{ width: `${total === 0 ? 0 : Math.round((seen / total) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <Button variant="primary" onClick={onStart}>
          {seen > 0 ? 'Continuar estudio inteligente' : 'Empezar estudio inteligente'}
        </Button>
        <div className="mt-2 text-xs text-[var(--muted)]">Primero repasamos lo importante y luego avanzamos con nuevas.</div>
        <div className="mt-2 text-xs text-[var(--muted)]">Puedes parar cuando quieras. Tu progreso se guarda solo.</div>

        <div className="mt-3">
          <Link className="text-sm text-[var(--ic-accent)]" to="/simulacro">
            Hacer un simulacro de examen →
          </Link>
          <div className="mt-1 text-xs text-[var(--muted)]">Simula el examen: 25 preguntas con el reparto oficial.</div>
        </div>
      </div>

      {showHow ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Cerrar"
              onClick={() => setShowHow(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-[var(--bg)] p-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">¿Cómo funciona el nivel?</div>
                <button type="button" className="text-sm text-[var(--ic-accent)]" onClick={() => setShowHow(false)}>
                  Entendido
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <div className="text-sm text-[var(--muted)]">
                  <div className="text-[var(--text)]">Tu nivel indica lo preparada/o que estás para el CCSE.</div>
                </div>

                <div className="text-sm text-[var(--muted)]">
                  <div className="text-[var(--text)]">Sube cuando:</div>
                  <div className="mt-2 space-y-1">
                    <div>• Ves preguntas nuevas</div>
                    <div>• Las recuerdas con facilidad (bien aprendidas)</div>
                    <div>• Estudias con regularidad</div>
                  </div>
                </div>

                <div className="text-sm text-[var(--muted)]">
                  Si haces el estudio inteligente, la app ajusta los repasos por ti.
                </div>

                <div className="text-xs text-[var(--muted)]">No necesitas configurar nada. Solo estudia.</div>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}

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

function Chip(props: { label: string; value: number }) {
  return (
    <span className="rounded-2xl bg-white px-3 py-2">
      <div className="text-xs text-[var(--muted)]">{props.label}</div>
      <div className="text-sm font-semibold">{props.value}</div>
    </span>
  )
}
