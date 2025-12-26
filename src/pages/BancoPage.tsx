import { useMemo, useState } from 'react'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { todayLocal } from '../srs/date'
import { getQuestionStatus, type QuestionStatus } from '../domain/status'
import type { TareaId } from '../domain/types'
import { TareaChip } from '../ui/StudyQuestionCard'
import { useOverlayEffects } from '../ui/useOverlayEffects'
import { ModalPortal } from '../ui/ModalPortal'

export function BancoPage() {
  const { dataset } = useDataset()
  const progressById = useAppStore((s) => s.progressById)
  const today = todayLocal()

  const labelFor = (id: TareaId) => {
    const meta = dataset?.tareas.find((t) => t.id === id)
    const name = meta?.name
    return name ? `Tarea ${id} · ${name}` : `Tarea ${id}`
  }

  const [query, setQuery] = useState('')
  const [tarea, setTarea] = useState<TareaId | 'all'>('all')
  const [status, setStatus] = useState<QuestionStatus | 'all'>('all')
  const [revealById, setRevealById] = useState<Record<string, boolean>>({})
  const [pickTareaOpen, setPickTareaOpen] = useState(false)
  const [pickStatusOpen, setPickStatusOpen] = useState(false)
  const [showStatusHelp, setShowStatusHelp] = useState(false)

  useOverlayEffects(pickTareaOpen || pickStatusOpen || showStatusHelp)

  const tareaLabel = tarea === 'all' ? 'Todas las tareas' : labelFor(tarea)
  const statusLabel = status === 'all' ? 'Todos los estados' : labelForStatus(status)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const questions = dataset?.questions ?? []
    return questions
      .filter((item) => {
        if (tarea !== 'all' && item.tareaId !== tarea) return false

        if (q) {
          const matchesId = item.id.toLowerCase().includes(q)
          const matchesText = item.question.toLowerCase().includes(q)
          if (!matchesId && !matchesText) return false
        }

        if (status !== 'all') {
          if (!dataset) return false
          const s = getQuestionStatus(item, dataset, progressById, today)
          if (s !== status) return false
        }

        return true
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [dataset, progressById, query, status, tarea, today])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por ID o texto…"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-3 text-left text-sm"
            aria-label="Filtrar por tarea"
            onClick={() => setPickTareaOpen(true)}
          >
            <span className="min-w-0 flex-1">
              <span
                className="block w-full truncate rounded-xl px-3 py-2"
                style={
                  tarea === 'all'
                    ? { backgroundColor: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text)' }
                    : {
                        backgroundColor: `color-mix(in srgb, var(--t${tarea}) 16%, white)`,
                        border: `1px solid color-mix(in srgb, var(--t${tarea}) 30%, white)`,
                        color: 'var(--text)',
                      }
                }
              >
                {tareaLabel}
              </span>
            </span>
            <span className="shrink-0 text-xs text-[var(--muted)]">▾</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-3 text-left text-sm"
            aria-label="Filtrar por estado"
            onClick={() => setPickStatusOpen(true)}
          >
            <span className="min-w-0 flex-1 truncate">{statusLabel}</span>
            <span className="shrink-0 text-xs text-[var(--muted)]">▾</span>
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-xs text-[var(--muted)] underline"
            onClick={() => setShowStatusHelp(true)}
          >
            ¿Qué significan los estados?
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-3 text-xs text-[var(--muted)]">
        {results.length} resultados
      </div>

      <div className="space-y-4">
        {results.map((item) => {
          const s = dataset ? getQuestionStatus(item, dataset, progressById, today) : 'new'
          const reveal = Boolean(revealById[item.id])
          const tareaName = dataset?.tareas.find((t) => t.id === item.tareaId)?.name
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">
                  {item.id} <span className="text-xs text-[var(--muted)]">· Tarea {item.tareaId}</span>
                </div>
                <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">{labelForStatus(s)}</span>
              </div>

              <div className="mt-2">
                <TareaChip tareaId={item.tareaId} name={tareaName} wrap />
              </div>

              <div className="mt-2 text-sm">{item.question}</div>

              <div className="mt-2 space-y-2">
                {item.options.map((o) => {
                  const isCorrect = o.letter === item.answer
                  return (
                    <div
                      key={o.letter}
                      className={
                        reveal && isCorrect
                          ? 'rounded-2xl bg-[var(--surface)] px-4 py-3 ring-2 ring-black/40'
                          : 'rounded-2xl bg-[var(--surface)] px-4 py-3'
                      }
                    >
                      <div className="text-sm">
                        <span className="mr-2 font-semibold">{o.letter})</span>
                        {o.text}
                      </div>
                      {reveal && isCorrect ? (
                        <div className="mt-1 text-xs font-semibold text-[var(--text)]">Respuesta correcta</div>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  className="text-sm text-[var(--ic-accent)] underline"
                  onClick={() =>
                    setRevealById((prev) => ({
                      ...prev,
                      [item.id]: !Boolean(prev[item.id]),
                    }))
                  }
                >
                  {reveal ? 'Ocultar respuesta' : 'Ver respuesta'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {pickTareaOpen ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Cerrar"
              onClick={() => setPickTareaOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-[var(--bg)] p-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Filtrar por tarea</div>
                <button
                  type="button"
                  className="text-sm text-[var(--ic-accent)]"
                  onClick={() => setPickTareaOpen(false)}
                >
                  Cancelar
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  className={
                    tarea === 'all'
                      ? 'w-full min-h-14 rounded-2xl bg-[var(--surface)] px-4 py-3 text-left text-sm font-semibold ring-2 ring-black/40'
                      : 'w-full min-h-14 rounded-2xl bg-[var(--surface)] px-4 py-3 text-left text-sm'
                  }
                  onClick={() => {
                    setTarea('all')
                    setPickTareaOpen(false)
                  }}
                >
                  Todas las tareas
                </button>

                {([1, 2, 3, 4, 5] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      tarea === id
                        ? 'w-full min-h-14 whitespace-normal break-words rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-2 ring-black/40'
                        : 'w-full min-h-14 whitespace-normal break-words rounded-2xl px-4 py-3 text-left text-sm'
                    }
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--t${id}) 16%, white)`,
                      border: `1px solid color-mix(in srgb, var(--t${id}) 30%, white)`,
                      color: 'var(--text)',
                    }}
                    onClick={() => {
                      setTarea(id)
                      setPickTareaOpen(false)
                    }}
                  >
                    {labelFor(id)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}

      {pickStatusOpen ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Cerrar"
              onClick={() => setPickStatusOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-[var(--bg)] p-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Filtrar por estado</div>
                <button
                  type="button"
                  className="text-sm text-[var(--ic-accent)]"
                  onClick={() => setPickStatusOpen(false)}
                >
                  Cancelar
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {[
                  { value: 'all' as const, label: 'Todos los estados' },
                  { value: 'new' as const, label: 'Nueva' },
                  { value: 'due' as const, label: 'Te toca repasar hoy' },
                  { value: 'weak' as const, label: 'En las que fallé' },
                  { value: 'mastered' as const, label: 'Bien aprendida' },
                  { value: 'learning' as const, label: 'Aprendiendo' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={
                      status === opt.value
                        ? 'w-full rounded-2xl bg-[var(--surface)] px-4 py-3 text-left text-sm font-semibold ring-2 ring-[var(--ic-accent)]'
                        : 'w-full rounded-2xl bg-[var(--surface)] px-4 py-3 text-left text-sm'
                    }
                    onClick={() => {
                      setStatus(opt.value)
                      setPickStatusOpen(false)
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}

      {showStatusHelp ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Cerrar"
              onClick={() => setShowStatusHelp(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-[var(--bg)] p-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Estados de las preguntas</div>
                <button
                  type="button"
                  className="text-sm text-[var(--ic-accent)]"
                  onClick={() => setShowStatusHelp(false)}
                >
                  Entendido
                </button>
              </div>

              <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
                <div>
                  <div className="font-semibold text-[var(--text)]">Nueva</div>
                  <div>Aún no la has practicado.</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--text)]">Te toca repasar</div>
                  <div>Está programada para repasar hoy (o estaba pendiente de días anteriores).</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--text)]">En las que fallé</div>
                  <div>Has fallado recientemente, la has marcado como débil, o el sistema detecta que necesita refuerzo.</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--text)]">Aprendiendo</div>
                  <div>Ya la has visto, pero todavía no está lo bastante consolidada como “bien aprendida”.</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--text)]">Bien aprendida</div>
                  <div>La has respondido bien de forma consistente y ya no necesita repasos tan frecuentes.</div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  )
}

function labelForStatus(status: QuestionStatus): string {
  if (status === 'new') return 'Nueva'
  if (status === 'due') return 'Te toca repasar'
  if (status === 'weak') return 'En las que fallé'
  if (status === 'mastered') return 'Bien aprendida'
  return 'Aprendiendo'
}
