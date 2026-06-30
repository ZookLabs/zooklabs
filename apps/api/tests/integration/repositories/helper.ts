import { expect } from "@std/expect"

/**
 * Assertion helper: Verify entity fields match expected values
 */
export function assertEntityEquals<T>(
  actual: T,
  expected: Partial<T>,
  _message?: string,
): void {
  for (const key in expected) {
    expect(actual[key]).toBe(expected[key])
  }
}

/**
 * Assertion helper: Verify date is recent (within last N seconds)
 */
export function assertRecentDate(date: Date, withinSeconds: number = 60): void {
  const now = new Date()
  const diff = Math.abs(now.getTime() - date.getTime())
  const withinMs = withinSeconds * 1000

  expect(diff).toBeLessThanOrEqual(withinMs)
}

/**
 * Assertion helper: Verify array has expected length
 */
export function assertArrayContains<T>(
  actual: T[],
  expectedLength: number,
  _message?: string,
): void {
  expect(actual).toHaveLength(expectedLength)
}
