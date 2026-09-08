export type DraftSnapshot = { text: string; revision: number }
// Revision also distinguishes editing away and back to identical text during a request.
export function clearSentDraft(current: DraftSnapshot, sent: DraftSnapshot): DraftSnapshot {
  return current.revision === sent.revision ? { text: '', revision: current.revision + 1 } : current
}
