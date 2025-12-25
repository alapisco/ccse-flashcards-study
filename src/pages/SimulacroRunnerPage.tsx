import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'
import { scoreSimulacro } from '../simulacro/buildSimulacro'
import { StudyQuestionCard, TareaChip } from '../ui/StudyQuestionCard'
import { ConfirmSheet } from '../ui/ConfirmSheet'

function formatMmSs(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export function SimulacroRunnerPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const session = useAppStore((s) => s.activeSession)
  const answerInSession = useAppStore((s) => s.answerInSession)
  const nextInSession = useAppStore((s) => s.nextInSession)
  const finishSession = useAppStore((s) => s.finishSession)

  const [chosen, setChosen] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [fallbackStartedAt] = useState(() => Date.now())
  const [confirmExit, setConfirmExit] = useState(false)

  const durationSec = session?.durationSec ?? 45 * 60
  const startedAt = session?.startedAt ?? fallbackStartedAt
  const deadlineMs = startedAt + durationSec * 1000
  const remainingSec = Math.max(0, Math.ceil((deadlineMs - now) / 1000))

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (!session || session.kind !== 'simulacro') return
    if (remainingSec > 0) return
    navigate('/simulacro/result', { replace: true })
  }, [navigate, remainingSec, session])

  const currentId = session?.ids[session.currentIndex] ?? null
  const q = useMemo(
    () => (currentId && dataset ? dataset.questions.find((qq) => qq.id === currentId) ?? null : null),
    [currentId, dataset],
  )

  if (!dataset) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">Cargando preguntas…</div>
        <Button onClick={() => navigate('/simulacro')}>Volver</Button>
      </div>
    )
  }

  if (!session || session.kind !== 'simulacro' || !currentId || !q) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">No hay simulacro activo.</div>
        <Button onClick={() => navigate('/simulacro')}>Volver</Button>
      </div>
    )
  }

  const total = session.plannedTotal ?? session.ids.length
  const index = session.currentIndex + 1

  const isLast = session.currentIndex + 1 >= total

  const onNext = () => {
    if (!chosen) return

    // En modo examen no mostramos feedback. Registramos la respuesta y avanzamos.
    answerInSession({ dataset, questionId: q.id, chosenLetter: chosen, confidence: 'guessed' })

    if (isLast) {
      navigate('/simulacro/result')
      return
    }

    nextInSession({ requeueWrong: false })
    setChosen(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold">Simulacro examen oficial CCSE 2026</div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[var(--text)] ring-1 ring-black/5">
            Pregunta {index}/{total}
          </div>
          <div className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[var(--text)] ring-1 ring-black/5">
            Tiempo: {formatMmSs(remainingSec)}
          </div>
        </div>
      </div>

      <StudyQuestionCard
        question={q}
        tareaName={dataset.tareas.find((t) => t.id === q.tareaId)?.name}
        selectedLetter={chosen}
        disabled={false}
        onSelect={(letter) => setChosen(letter)}
      >
        <div className="mt-3 space-y-3">
          <Button variant="primary" onClick={onNext} disabled={!chosen || remainingSec <= 0}>
            {isLast ? 'Ver resultados' : 'Siguiente'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setConfirmExit(true)
            }}
          >
            Salir
          </Button>
        </div>
      </StudyQuestionCard>

      <ConfirmSheet
        open={confirmExit}
        title="Salir del simulacro"
        description="Se perderán los resultados de esta sesión."
        confirmLabel="Salir"
        cancelLabel="Continuar"
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false)
          finishSession()
          navigate('/simulacro')
        }}
      />
    </div>
  )
}

export function SimulacroResultadosPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const session = useAppStore((s) => s.activeSession)
  const finishSession = useAppStore((s) => s.finishSession)
  const startIntelligent = useAppStore((s) => s.startIntelligent)
  const recordSimulacroResult = useAppStore((s) => s.recordSimulacroResult)

  const scored = useMemo(() => {
    if (!dataset) return null
    if (!session || session.kind !== 'simulacro') return null
    return scoreSimulacro({ ids: session.ids, correctById: session.correctById, dataset })
  }, [dataset, session])

  useEffect(() => {
    if (!session || session.kind !== 'simulacro') return
    if (!scored) return

    const durationSec = session.durationSec ?? 45 * 60
    const startedAt = session.startedAt ?? Date.now()
    const timeSpentSec = Math.max(0, Math.min(durationSec, Math.round((Date.now() - startedAt) / 1000)))

    const sessionId = session.id ?? `legacy_${startedAt}`

    recordSimulacroResult({
      sessionId,
      finishedAt: new Date().toISOString(),
      total: scored.total,
      totalCorrect: scored.totalCorrect,
      apto: scored.apto,
      byTarea: scored.byTarea,
      durationSec,
      timeSpentSec,
    })
  }, [recordSimulacroResult, scored, session])

  if (!dataset) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">Cargando preguntas…</div>
        <Button onClick={() => navigate('/simulacro')}>Volver</Button>
      </div>
    )
  }

  if (!session || session.kind !== 'simulacro') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">No hay resultados.</div>
        <Button onClick={() => navigate('/simulacro')}>Volver</Button>
      </div>
    )
  }

  if (!scored) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">No hay resultados.</div>
        <Button onClick={() => navigate('/simulacro')}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Resultado</div>
        <div className="mt-1 text-3xl font-semibold">
          {scored.totalCorrect}/{scored.total}
        </div>
        <div className={scored.apto ? 'mt-1 text-sm font-semibold text-green-700' : 'mt-1 text-sm font-semibold text-red-700'}>
          {scored.apto ? 'APTO' : 'NO APTO'} (umbral 15/25)
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">Por tarea</div>
        <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
          {([1, 2, 3, 4, 5] as const).map((t) => (
            <div key={t} className="grid w-full grid-cols-[minmax(0,1fr)_3.5rem] items-start gap-3">
              <div className="min-w-0 w-full max-w-xs">
                <TareaChip tareaId={t} wrap name={dataset.tareas.find((x) => x.id === t)?.name ?? `Tarea ${t}`} />
              </div>
              <span className="pt-1 text-right font-semibold tabular-nums text-[var(--text)]">
                {scored.byTarea[t].correct}/{scored.byTarea[t].total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {session.wrongIds.length > 0 ? (
        <Button
          variant="primary"
          onClick={() => {
            startIntelligent({ dataset, priorityIds: session.wrongIds })
            finishSession()
            navigate('/estudio/sesion')
          }}
        >
          Repasar fallos ({session.wrongIds.length})
        </Button>
      ) : null}

      <Button
        onClick={() => {
          finishSession()
          navigate('/')
        }}
      >
        Volver a Inicio
      </Button>
    </div>
  )
}
