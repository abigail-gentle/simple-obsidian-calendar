/**
 * Utilities for validating and working with weekly note format strings.
 *
 * moment.js has two independent "week systems":
 *
 *   Locale week system  — gggg / gg (year)  +  ww / w (week number)
 *   ISO week system     — GGGG / GG (year)  +  WW / W (week number)
 *
 * Mixing year tokens from one system with week tokens from the other causes
 * moment to silently discard the year from the string and substitute the
 * current year instead. For example:
 *
 *   moment("2025 Week 12", "gggg [Week] WW", true)  →  2026-W12  (wrong!)
 *
 * This is a known moment.js quirk — the tokens are accepted without error but
 * the year is ignored. The result is that a note titled "2025 Week 12" appears
 * as a dot on week 12 of the *current* year rather than 2025.
 *
 * hasWeekTokenMismatch() detects this condition by scanning the format string
 * for escaped literals first, then checking whether the year and week tokens
 * are from the same system.
 */

/**
 * Returns true when the format string mixes locale week-year tokens
 * (gggg / gg) with ISO week-number tokens (WW / W), or vice versa.
 *
 * Escaped literals ([...]) are stripped before checking so that a format
 * like "gggg [[Week]] WW" does not produce a false positive from the W
 * inside the brackets.
 *
 * @param format  A moment.js format string, e.g. "gggg [Week] WW"
 */
export function hasWeekTokenMismatch(format: string): boolean {
  // Remove escaped literals — anything inside [...] — before token scanning.
  // This prevents e.g. the literal text "[Week]" from being mistaken for tokens.
  const bare = format.replace(/\[[^\]]*\]/g, "");

  const hasLocaleYear = /gggg|gg/.test(bare);   // locale week-year
  const hasISOYear    = /GGGG|GG/.test(bare);   // ISO week-year
  const hasISOWeek    = /WW|W/.test(bare);       // ISO week number (uppercase)
  const hasLocaleWeek = /ww|w/.test(bare);       // locale week number (lowercase)

  // Mismatch: locale year paired with ISO week, or ISO year paired with locale week.
  return (hasLocaleYear && hasISOWeek) || (hasISOYear && hasLocaleWeek);
}
