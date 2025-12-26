import { useState } from 'react'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { todayLocal } from '../srs/date'
import { Button } from '../ui/Button'
import { isDue } from '../domain/status'
import { Link, useNavigate } from 'react-router-dom'
import { computeLevel } from '../domain/level'
import { computeMasteredCount } from '../domain/level'
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

  const newCount = dataset.questions.filter((q) => !progressById[q.id]).length

  const mastered = computeMasteredCount({ dataset, progressById, today })

  const seenPct = total === 0 ? 0 : Math.max(0, Math.min(1, seen / total))
  const masteredPct = total === 0 ? 0 : Math.max(0, Math.min(1, mastered / total))

  const level = computeLevel({ dataset, progressById, today })

  const appVersion = __APP_VERSION__

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
        <div className="text-sm font-semibold">Preguntas</div>

        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Chip label="Ya vistas" value={`${seen} de ${total}`} />
          <Chip label="Por ver" value={newCount} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]" aria-hidden="true">
          <span>Cobertura</span>
          <span>{Math.round(seenPct * 100)}%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-white" aria-label={`Ya vistas: ${seen} de ${total}.`}>
          <div className="h-2 rounded-full bg-[var(--muted)]" style={{ width: `${Math.round(seenPct * 100)}%` }} />
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Aprendizaje</div>

        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Chip label="Bien aprendidas" value={mastered} />
          <Chip label="Para repasar" value={dueCount} />
          <Chip label="Por ver" value={newCount} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]" aria-hidden="true">
          <span>Dominio</span>
          <span>{Math.round(masteredPct * 100)}%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-white" aria-label={`Bien aprendidas: ${mastered} de ${total}.`}>
          <div className="h-2 rounded-full bg-[var(--muted)]" style={{ width: `${Math.round(masteredPct * 100)}%` }} />
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
                  <div className="text-[var(--text)]">Tu nivel estima tu preparación para el CCSE.</div>
                </div>

                <div className="text-sm text-[var(--muted)]">
                  <div className="text-[var(--text)]">Se calcula con dos métricas:</div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="font-semibold text-[var(--text)]">Cobertura</div>
                      <div>Preguntas vistas / total</div>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text)]">Dominio</div>
                      <div>Bien aprendidas / total (el mismo estado que ves en “Preguntas → Bien aprendidas”)</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-[var(--muted)]">
                  <div className="text-[var(--text)]">Umbrales del nivel</div>
                  <div className="mt-2 space-y-1">
                    <div>• Principiante: cobertura &lt; 15%</div>
                    <div>• Intermedio: dominio &lt; 35%</div>
                    <div>• Avanzado: dominio &lt; 70%</div>
                    <div>• Listo: dominio ≥ 70%</div>
                  </div>
                </div>

                <div className="text-sm text-[var(--muted)]">El estudio inteligente prioriza repasos y refuerzo para mejorar tu dominio.</div>

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

      <div className="pb-2 text-center text-[10px] text-[var(--muted)]">v{appVersion}</div>
    </div>
  )
}

function Chip(props: { label: string; value: React.ReactNode }) {
  return (
    <span className="rounded-2xl bg-white px-3 py-2">
      <div className="text-xs text-[var(--muted)]">{props.label}</div>
      <div className="text-sm font-semibold">{props.value}</div>
    </span>
  )
}
