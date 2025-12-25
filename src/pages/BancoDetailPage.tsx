import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'

export function BancoDetailPage() {
  const { id } = useParams()
  const { dataset } = useDataset()
  const toggleManualWeak = useAppStore((s) => s.toggleManualWeak)
  const progress = useAppStore((s) => (id ? s.progressById[id] : undefined))

  const q = useMemo(
    () => (id && dataset ? dataset.questions.find((qq) => qq.id === id) ?? null : null),
    [dataset, id],
  )

  if (!dataset) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">Cargando preguntas…</div>
        <Link className="text-sm text-[var(--ic-accent)]" to="/practicar">
          Volver
        </Link>
      </div>
    )
  }

  if (!id || !q) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">Pregunta no encontrada.</div>
        <Link className="text-sm text-[var(--ic-accent)]" to="/practicar">
          Volver
        </Link>
      </div>
    )
  }

  const answerText = q.options.find((o) => o.letter === q.answer)?.text ?? ''

  return (
    <div className="space-y-4">
      <Link className="text-sm text-[var(--ic-accent)]" to="/practicar">
        ← Preguntas
      </Link>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">
          {q.id} · Tarea {q.tareaId}
        </div>
        <div className="mt-2 text-base">{q.question}</div>
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className="text-sm font-semibold">Respuesta correcta</div>
        <div className="mt-2 text-sm">
          <span className="font-semibold">{q.answer})</span> {answerText}
        </div>
      </div>

      {progress ? (
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          <div>Vistas: {progress.seenCount}</div>
          <div>Fallos: {progress.wrongCount}</div>
          <div>Próximo repaso: {progress.nextReviewAt}</div>
          <div>Leech score: {progress.leechScore}</div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Aún no la has visto.</div>
      )}

      <Button onClick={() => (id ? toggleManualWeak(id) : undefined)} disabled={!progress}>
        {progress?.manualWeak ? 'Quitar de “En las que fallé”' : 'Añadir a “En las que fallé”'}
      </Button>
    </div>
  )
}
