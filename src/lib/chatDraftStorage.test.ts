import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearChatDraft,
  clearChatDraftsForUser,
  readChatDraft,
  writeChatDraft,
} from './chatDraftStorage'
afterEach(() => vi.unstubAllGlobals())
function storage() {
  const values = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    key: (index: number) => [...values.keys()][index] || null,
    get length() {
      return values.size
    },
  })
  return values
}
describe('session chat draft', () => {
  it('survives remount and expires without reaching the network', () => {
    storage()
    writeChatDraft('u', 'c', { text: 'draft', revision: 4 }, 1000)
    expect(readChatDraft('u', 'c', 1001).text).toBe('draft')
    expect(readChatDraft('u', 'other', 1001).text).toBe('')
    expect(readChatDraft('u', 'c', 1000 + 86400001).text).toBe('')
  })
  it('does not save empty drafts and handles malformed/oversized storage', () => {
    const values = storage()
    writeChatDraft('u', 'c', { text: 'hello', revision: 1 }, 1000)
    clearChatDraft('u', 'c')
    expect(values.size).toBe(0)
    values.set('bibo-chat-draft-v1:u:c', '{"text":42,"savedAt":1000}')
    expect(readChatDraft('u', 'c', 1001).text).toBe('')
    values.set('bibo-chat-draft-v1:u:c', JSON.stringify({ text: 'x'.repeat(2001), savedAt: 1000 }))
    expect(readChatDraft('u', 'c', 1001).text).toBe('')
  })
  it('clears all drafts for one account without touching another account', () => {
    const values = storage()
    values.set('bibo-chat-draft-v1:u:c1', 'a')
    values.set('bibo-chat-draft-v1:u:c2', 'b')
    values.set('bibo-chat-draft-v1:other:c', 'secret')
    clearChatDraftsForUser('u')
    expect([...values.keys()]).toEqual(['bibo-chat-draft-v1:other:c'])
  })
  it('surfaces session storage failures to the caller', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {},
    })
    expect(() => writeChatDraft('u', 'c', { text: 'x', revision: 0 })).toThrow('quota')
  })
})
