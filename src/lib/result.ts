export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; issues?: Record<string, string[]> }

export const ok = <T>(data: T): Result<T> => ({ ok: true, data })

export const err = <E = string>(error: E, issues?: Record<string, string[]>): Result<never, E> =>
  issues ? { ok: false, error, issues } : { ok: false, error }
