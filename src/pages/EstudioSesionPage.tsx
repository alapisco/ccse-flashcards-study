import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../data/datasetContext'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../ui/Button'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import { StudyHeader, StudyQuestionCard } from '../ui/StudyQuestionCard'
import type { IntelligentConstraint } from '../study/getNextIntelligentQuestion'

type Phase = 'answering' | 'feedback'

type Summary = { answered: number; correct: number }

export function EstudioSesionPage() {
  const navigate = useNavigate()
  const { dataset } = useDataset()

  const intelligent = useAppStore((s) => s.intelligent)
  const startIntelligent = useAppStore((s) => s.startIntelligent)
  const nextIntelligent = useAppStore((s) => s.nextIntelligent)
  const finishIntelligent = useAppStore((s) => s.finishIntelligent)
  const recordIntelligentAnswer = useAppStore((s) => s.recordIntelligentAnswer)
  const answerInSession = useAppStore((s) => s.answerInSession)

  const [phase, setPhase] = useState<Phase>('answering')
  const [chosen, setChosen] = useState<string | null>(null)
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null)
  const [confidence, setConfidence] = useState<'knew' | 'guessed' | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [confirmFinish, setConfirmFinish] = useState(false)

  useEffect(() => {
    if (!dataset) return
    if (summary) return
    if (intelligent.active) return
    startIntelligent({ dataset, constraint: { kind: 'all' } })
  }, [dataset, intelligent.active, startIntelligent, summary])

  const currentId = intelligent.currentId
  const q = useMemo(
    () => (currentId && dataset ? dataset.questions.find((qq) => qq.id === currentId) ?? null : null),
    [currentId, dataset],
  )

  const header = useMemo(() => {
    if (!dataset) return { title: 'Estudio inteligente', subtitleLeft: '', subtitleRight: '' }

    const constraint: IntelligentConstraint = intelligent.constraint
    if (constraint.kind === 'tarea') {
      const tareaName = dataset.tareas.find((t) => t.id === constraint.tareaId)?.name ?? `Tarea ${constraint.tareaId}`
      return {
        title: `Estudio inteligente · ${tareaName}`,
        subtitleLeft: 'Solo esta tarea',
        subtitleRight: `${intelligent.answered} respondidas`,
      }
    }

    return {
      title: 'Estudio inteligente',
      subtitleLeft: 'Todas las tareas',
      subtitleRight: `${intelligent.answered} respondidas`,
    }
  }, [dataset, intelligent.answered, intelligent.constraint])

  const finalize = () => setConfirmFinish(true)
  const confirmFinalize = () => {
    setConfirmFinish(false)
    setSummary({ answered: intelligent.answered, correct: intelligent.correct })
    finishIntelligent()
  }

  if (!dataset) {
    return <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">Cargando preguntas…</div>
  }

  if (summary) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--surface)] p-4">
          <div className="text-sm font-semibold">Resumen</div>
          <div className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            <div>Respondidas: {summary.answered}</div>
            <div>Aciertos: {summary.correct}</div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            navigate('/')
          }}
        >
          Volver a Inicio
        </Button>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="space-y-4">
        <StudyHeader title={header.title} subtitleLeft={header.subtitleLeft} subtitleRight={header.subtitleRight} />

        <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          No hay preguntas disponibles ahora. Vuelve más tarde o consulta el Banco.
        </div>

        <Button onClick={() => navigate('/practicar')}>Ir a Preguntas</Button>

        <FinishSessionButton onClick={finalize} />

        <ConfirmSheet
          open={confirmFinish}
          title="¿Finalizar sesión?"
          description="Tu progreso ya está guardado. Podrás continuar cuando quieras."
          confirmLabel="Finalizar"
          cancelLabel="Cancelar"
          onCancel={() => setConfirmFinish(false)}
          onConfirm={confirmFinalize}
        />
      </div>
    )
  }

  const onResponder = () => {
    if (!chosen) return
    const correct = chosen === q.answer
    setWasCorrect(correct)
    setPhase('feedback')
  }

  const onSetConfidence = (c: 'knew' | 'guessed') => {
    setConfidence(c)
  }

  const onNext = () => {
    if (!chosen) return

    const correct = chosen === q.answer

    if (correct) {
      if (!confidence) return
      answerInSession({ dataset, questionId: q.id, chosenLetter: chosen, confidence })
    } else {
      answerInSession({ dataset, questionId: q.id, chosenLetter: chosen, confidence: 'guessed' })
    }

    recordIntelligentAnswer({ questionId: q.id, correct })
    nextIntelligent({ dataset })
    setPhase('answering')
    setChosen(null)
    setWasCorrect(null)
    setConfidence(null)
  }

  return (
    <div className="space-y-4">
      <StudyHeader title={header.title} subtitleLeft={header.subtitleLeft} subtitleRight={header.subtitleRight} />

      <StudyQuestionCard
        question={q}
        tareaName={dataset.tareas.find((t) => t.id === q.tareaId)?.name}
        selectedLetter={chosen}
        disabled={phase === 'feedback'}
        onSelect={(letter) => setChosen(letter)}
      >

        {phase === 'answering' ? (
          <div className="mt-3 space-y-2">
            {!chosen ? <div className="text-xs text-[var(--muted)]">Selecciona una opción</div> : null}
            <Button variant="primary" onClick={onResponder} disabled={!chosen}>
              Responder
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl bg-white p-4 text-sm">
              <div className={wasCorrect ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                {wasCorrect ? '✅ Correcto' : '❌ Incorrecto'}
              </div>
              <div className="mt-1 text-[var(--muted)]">Respuesta correcta: {q.answer}</div>
            </div>

            {wasCorrect ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => onSetConfidence('knew')}
                  className={
                    confidence === 'knew'
                      ? 'bg-white ring-2 ring-[var(--ic-accent)] border border-black/5'
                      : 'bg-white border border-black/5'
                  }
                >
                  Lo sabía
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onSetConfidence('guessed')}
                  className={
                    confidence === 'guessed'
                      ? 'bg-white ring-2 ring-[var(--ic-accent)] border border-black/5'
                      : 'bg-white border border-black/5'
                  }
                >
                  Adiviné
                </Button>
              </div>
            ) : null}

            <Button variant="primary" onClick={onNext} disabled={wasCorrect === true && !confidence}>
              Siguiente
            </Button>
          </div>
        )}
      </StudyQuestionCard>

      <FinishSessionButton onClick={finalize} />

      <ConfirmSheet
        open={confirmFinish}
        title="¿Finalizar sesión?"
        description="Tu progreso ya está guardado. Podrás continuar cuando quieras."
        confirmLabel="Finalizar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={confirmFinalize}
      />
    </div>
  )
}

function FinishSessionButton(props: { onClick: () => void }) {
  return (
    <button type="button" className="w-full text-center text-sm text-[var(--muted)] underline" onClick={props.onClick}>
      Finalizar sesión
    </button>
  )
}
