import { describe, expect, it } from 'vitest'
import { clearSentDraft } from './chatDraft'
describe('in-flight chat composer', () => {
  it('clears only an unchanged submitted draft', () => {
    expect(clearSentDraft({ text: 'hello', revision: 4 }, { text: 'hello', revision: 4 })).toEqual({
      text: '',
      revision: 5,
    })
  })
  it('retains edits made while a send is pending', () => {
    const current = { text: 'hello, another thought', revision: 5 }
    expect(clearSentDraft(current, { text: 'hello', revision: 4 })).toBe(current)
  })
  it('retains deliberate replacement with the same text', () => {
    const current = { text: 'hello', revision: 6 }
    expect(clearSentDraft(current, { text: 'hello', revision: 4 })).toBe(current)
  })
})
