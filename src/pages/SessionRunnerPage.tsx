import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'

type Phase = 'answering' | 'feedback'

export function SessionRunnerPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()
  const session = useAppStore((s) => s.activeSession)
  const answerInSession = useAppStore((s) => s.answerInSession)
  const nextInSession = useAppStore((s) => s.nextInSession)
  const finishSession = useAppStore((s) => s.finishSession)
  const requeueWrong = useAppStore((s) => s.settings.requeueWrong)

  const [phase, setPhase] = useState<Phase>('answering')
  const [chosen, setChosen] = useState<string | null>(null)
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null)
  const [confidence, setConfidence] = useState<'knew' | 'guessed' | null>(null)

  const currentId = session?.ids[session.currentIndex] ?? null
  const q = useMemo(
    () => (currentId && dataset ? dataset.questions.find((qq) => qq.id === currentId) ?? null : null),
    [currentId, dataset],
  )

  if (!dataset) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">Cargando preguntas…</div>
        <Button onClick={() => navigate('/estudiar')}>Volver</Button>
      </div>
    )
  }

  if (!session || !currentId || !q) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">No hay sesión activa.</div>
        <Button onClick={() => navigate('/estudiar')}>Volver</Button>
      </div>
    )
  }

  const total = session.plannedTotal ?? session.ids.length
  const index = session.currentIndex + 1

  const onResponder = () => {
    if (!chosen) return
    const correct = chosen === q.answer
    setWasCorrect(correct)
    if (!correct) {
      answerInSession({
        dataset,
        questionId: q.id,
        chosenLetter: chosen,
        confidence: 'guessed',
      })
    }
    setPhase('feedback')
  }

  const onSetConfidence = (c: 'knew' | 'guessed') => {
    setConfidence(c)
    if (wasCorrect !== true) return
    if (!chosen) return
    answerInSession({
      dataset,
      questionId: q.id,
      chosenLetter: chosen,
      confidence: c,
    })
  }

  const onNext = () => {
    const isLast = session.currentIndex + 1 >= total
    if (isLast) {
      navigate('/estudiar/resumen')
      return
    }

    nextInSession({ requeueWrong })
    setPhase('answering')
    setChosen(null)
    setWasCorrect(null)
    setConfidence(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>
          Pregunta {index}/{total}
        </span>
        <span className="rounded-full bg-[var(--surface)] px-3 py-1">Tarea {q.tareaId}</span>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold">{q.id}</div>
        <div className="mt-2 text-base">{q.question}</div>
      </div>

      <div className="space-y-2">
        {q.options.map((o) => (
          <button
            key={o.letter}
            disabled={phase === 'feedback'}
            onClick={() => setChosen(o.letter)}
            className={
              chosen === o.letter
                ? 'w-full rounded-2xl bg-white px-4 py-3 text-left ring-2 ring-[var(--ic-accent)]'
                : 'w-full rounded-2xl bg-white px-4 py-3 text-left'
            }
          >
            <div className="text-sm">
              <span className="mr-2 font-semibold">{o.letter})</span>
              {o.text}
            </div>
          </button>
        ))}
      </div>

      {phase === 'answering' ? (
        <Button variant="primary" onClick={onResponder} disabled={!chosen}>
          Responder
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
            <div className={wasCorrect ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
              {wasCorrect ? '✅ Correcto' : '❌ Incorrecto'}
            </div>
            <div className="mt-1 text-[var(--muted)]">Respuesta correcta: {q.answer}</div>
          </div>

          {wasCorrect ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onSetConfidence('knew')}
                className={confidence === 'knew' ? 'ring-2 ring-[var(--ic-accent)]' : undefined}
              >
                La sabía
              </Button>
              <Button
                onClick={() => onSetConfidence('guessed')}
                className={confidence === 'guessed' ? 'ring-2 ring-[var(--ic-accent)]' : undefined}
              >
                Dudé
              </Button>
            </div>
          ) : null}

          <Button variant="primary" onClick={onNext} disabled={wasCorrect === true && !confidence}>
            Siguiente
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              finishSession()
              navigate('/estudiar')
            }}
          >
            Terminar
          </Button>
        </div>
      )}
    </div>
  )
}
