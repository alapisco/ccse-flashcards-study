import type { ReactNode } from 'react'
import type { TareaId } from '../domain/types'

type Option = { letter: string; text: string }

type QuestionLike = {
  id: string
  tareaId: TareaId
  question: string
  options: Option[]
}

export function StudyHeader(props: { title: string; subtitleLeft?: string; subtitleRight?: string }) {
  const showSubtitle = Boolean(props.subtitleLeft || props.subtitleRight)

  return (
    <div>
      <div className="text-sm font-semibold">{props.title}</div>
      {showSubtitle ? (
        <div className="mt-1 flex items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <div className="truncate">{props.subtitleLeft}</div>
          <div className="shrink-0">{props.subtitleRight}</div>
        </div>
      ) : null}
    </div>
  )
}

export function TareaChip(props: { tareaId: TareaId; name?: string; wrap?: boolean }) {
  const label = props.name ?? `Tarea ${props.tareaId}`
  const colorVar = `var(--t${props.tareaId})`

  return (
    <span
      className={
        props.wrap
          ? 'block w-full whitespace-normal break-words rounded-2xl px-3 py-1 text-left text-xs'
          : 'inline-block max-w-full truncate rounded-full px-3 py-1 text-center text-xs'
      }
      style={{
        backgroundColor: `color-mix(in srgb, ${colorVar} 16%, white)`,
        border: `1px solid color-mix(in srgb, ${colorVar} 30%, white)`,
        color: 'var(--text)',
      }}
      title={label}
    >
      {label}
    </span>
  )
}

export function StudyQuestionCard(props: {
  question: QuestionLike
  tareaName?: string
  selectedLetter: string | null
  disabled?: boolean
  onSelect: (letter: string) => void
  children?: ReactNode
}) {
  const q = props.question

  return (
    <div className="rounded-2xl bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-[var(--text)]">#{q.id}</div>
      </div>

      <div className="mt-2 flex items-center justify-start">
        <TareaChip tareaId={q.tareaId} name={props.tareaName} />
      </div>

      <div className="mt-3 text-base">{q.question}</div>

      <div className="mt-3 space-y-2">
        {q.options.map((o) => (
          <button
            key={o.letter}
            disabled={props.disabled}
            onClick={() => props.onSelect(o.letter)}
            className={
              props.selectedLetter === o.letter
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

      {props.children}
    </div>
  )
}
