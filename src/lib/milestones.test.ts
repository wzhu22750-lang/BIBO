import { describe, expect, it } from 'vitest'
import { buildMilestones, getNextWaitingMilestone } from './milestones'
import type { Space } from './types'

function makeTestSpace(overrides: Partial<Space> = {}): Space {
  return {
    me: { id: 'u1', name: '祝哥', avatar: 'dog' },
    partner: { id: 'u2', name: '溜宝', avatar: 'bunny' },
    couple: {
      id: 'c1',
      name: '我们的空间',
      together_since: '2022-03-13',
    },
    messages: [],
    events: [],
    photos: [],
    pings: [],
    focus: [],
    ...overrides,
  }
}

describe('milestones', () => {
  it('calculates milestones based on together_since and counts', () => {
    // 2026-09-08 is 1640 days after 2022-03-13
    const now = new Date('2026-09-08T12:00:00Z')
    const space = makeTestSpace({
      photos: [
        {
          id: 'p1',
          couple_id: 'c1',
          uploaded_by: 'u1',
          path: 'photo.jpg',
          caption: 'test',
          created_at: '2026-09-08T00:00:00Z',
        },
      ],
      events: [
        {
          id: 'e1',
          couple_id: 'c1',
          title: '生日',
          target_at: '2026-09-08',
          yearly: true,
          kind: 'anniversary',
          category: 'birthday',
          emoji: 'cake',
          created_by: 'u1',
        },
      ],
      messages: [
        {
          id: 'm1',
          couple_id: 'c1',
          sender_id: 'u1',
          content: 'hi',
          created_at: '2026-09-08T00:00:00Z',
        },
      ],
      pings: [
        {
          id: 'pi1',
          couple_id: 'c1',
          sender_id: 'u1',
          kind: 'heart',
          created_at: '2026-09-08T00:00:00Z',
        },
      ],
    })

    const list = buildMilestones(space, now)
    expect(list.length).toBeGreaterThan(25)

    // Check categories
    const daysMilestones = list.filter((m) => m.category === 'days')
    const photoMilestones = list.filter((m) => m.category === 'photos')
    const eventMilestones = list.filter((m) => m.category === 'events')
    const interactMilestones = list.filter((m) => m.category === 'interaction')

    expect(daysMilestones.length).toBeGreaterThanOrEqual(10)
    expect(photoMilestones.length).toBeGreaterThanOrEqual(5)
    expect(eventMilestones.length).toBeGreaterThanOrEqual(5)
    expect(interactMilestones.length).toBeGreaterThanOrEqual(6)

    // 1640 days: 100, 365, 520, 730, 999, 1000, 1314, 1500 are reached!
    const d100 = list.find((m) => m.id === 'days-100')!
    expect(d100.reached).toBe(true)
    const d1500 = list.find((m) => m.id === 'days-1500')!
    expect(d1500.reached).toBe(true)

    // 1825 is waiting
    const d1825 = list.find((m) => m.id === 'days-1825')!
    expect(d1825.reached).toBe(false)
    expect(d1825.waitingDesc).toContain('还差 185 天')

    // 1 photo: photos-1 reached, photos-5 waiting
    const p1 = list.find((m) => m.id === 'photos-1')!
    expect(p1.reached).toBe(true)
    const p5 = list.find((m) => m.id === 'photos-5')!
    expect(p5.reached).toBe(false)

    // 1 event: events-1 reached, events-3 waiting
    const e1 = list.find((m) => m.id === 'events-1')!
    expect(e1.reached).toBe(true)
    const e3 = list.find((m) => m.id === 'events-3')!
    expect(e3.reached).toBe(false)

    // Next waiting milestone is found
    const next = getNextWaitingMilestone(list)
    expect(next).toBeDefined()
    expect(next?.reached).toBe(false)
  })

  it('handles null together_since gracefully', () => {
    const space = makeTestSpace({ couple: null })
    const list = buildMilestones(space)
    expect(list.every((m) => m.category !== 'days' || !m.reached)).toBe(true)
  })
})
