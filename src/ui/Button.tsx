import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ className, variant = 'secondary', ...props }: Props) {
  return (
    <button
      className={cn(
        'w-full rounded-xl px-4 py-3 text-base font-medium transition active:scale-[0.99] disabled:opacity-50',
        variant === 'primary' && 'bg-[var(--ic-accent)] text-white',
        variant === 'secondary' && 'bg-[var(--surface)] text-[var(--text)]',
        variant === 'ghost' && 'bg-transparent text-[var(--text)]',
        variant === 'danger' && 'bg-transparent text-[var(--ic-accent)]',
        className,
      )}
      {...props}
    />
  )
}
