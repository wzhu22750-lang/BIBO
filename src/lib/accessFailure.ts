// Only explicit authorization failures invalidate an already-rendered private space.
// Schema, validation and transport errors remain independently recoverable.
export function accessFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const value = error as { code?: unknown; status?: unknown }
  return (
    value.status === 401 ||
    value.status === 403 ||
    ['42501', 'PGRST301', 'PGRST302', 'PGRST303'].includes(String(value.code || ''))
  )
}
