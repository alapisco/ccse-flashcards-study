import { describe, expect, it } from 'vitest'
import { isDue } from '../domain/status'

describe('isDue', () => {
  it('treats dates before today as due', () => {
    expect(isDue('2025-12-24', '2025-12-25')).toBe(true)
  })

  it('treats future dates as not due', () => {
    expect(isDue('2025-12-26', '2025-12-25')).toBe(false)
  })

  it('treats today as due when not seen today', () => {
    expect(isDue('2025-12-25', '2025-12-25', '2025-12-24')).toBe(true)
    expect(isDue('2025-12-25', '2025-12-25', undefined)).toBe(true)
  })

  it('treats today as not due when already seen today', () => {
    expect(isDue('2025-12-25', '2025-12-25', '2025-12-25')).toBe(false)
  })
})
