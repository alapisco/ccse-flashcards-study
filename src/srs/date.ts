export function toLocalDateString(date: Date): string {
  // v1: we store YYYY-MM-DD; relying on runtime local timezone.
  // Tests use injected today strings.
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayLocal(): string {
  return toLocalDateString(new Date())
}

export function parseLocalDate(dateString: string): Date {
  // Interpret as local midnight.
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)
}
