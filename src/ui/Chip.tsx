import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import { cn } from './cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  colorVar?: string
}

export function Chip({ className, selected, colorVar, ...props }: Props) {
  const style =
    selected && colorVar
      ? ({
          ...(props.style ?? {}),
          ['--tw-ring-color' as unknown as keyof CSSProperties]: colorVar,
        } as CSSProperties)
      : props.style

  return (
    <button
      className={cn(
        'rounded-full px-3 py-1 text-sm transition',
        selected
          ? 'bg-[var(--surface)] text-[var(--text)] ring-2 ring-[var(--ic-accent)]'
          : 'bg-[var(--surface)] text-[var(--muted)]',
        className,
      )}
      style={style}
      {...props}
    />
  )
}
