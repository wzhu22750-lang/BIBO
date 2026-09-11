import { describe, expect, it } from 'vitest'
import {
  DAILY_TASK_POOL,
  getBusinessDate,
  getDailyTaskTemplate,
  calculateStreak,
  TASK_TYPE_META,
} from './dailyTaskPool'
import type { DailyTaskHistoryItem } from './dailyTaskTypes'

describe('dailyTaskPool and deterministic selector', () => {
  it('contains 565 curated daily tasks (one for each day of the year and expanded pool)', () => {
    expect(DAILY_TASK_POOL.length).toBe(565)
    const uniqueIds = new Set(DAILY_TASK_POOL.map((t) => t.id))
    expect(uniqueIds.size).toBe(565)
    const uniqueTitles = new Set(DAILY_TASK_POOL.map((t) => t.title))
    expect(uniqueTitles.size).toBe(565)
  })

  it('assigns 365 unique tasks for all 365 days of a calendar year', () => {
    const start = new Date(Date.UTC(2026, 0, 1))
    const taskIdsOfYear = new Set<string>()
    for (let i = 0; i < 365; i++) {
      const d = new Date(start.getTime() + i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const template = getDailyTaskTemplate(dateStr)
      taskIdsOfYear.add(template.id)
    }
    expect(taskIdsOfYear.size).toBe(365)
  })

  it('covers all 6 task types and required themes', () => {
    const types = new Set(DAILY_TASK_POOL.map((t) => t.task_type))
    expect(types).toContain('interaction')
    expect(types).toContain('photo')
    expect(types).toContain('question')
    expect(types).toContain('focus')
    expect(types).toContain('memory')
    expect(types).toContain('random')

    const categories = new Set(DAILY_TASK_POOL.map((t) => t.category))
    expect(categories).toContain('表达')
    expect(categories).toContain('猜测')
    expect(categories).toContain('回忆')
    expect(categories).toContain('照片')
    expect(categories).toContain('小问题')
    expect(categories).toContain('共同完成')
    expect(categories).toContain('观察')
    expect(categories).toContain('分享')
    expect(categories).toContain('趣味挑战')
    expect(categories).toContain('专注陪伴')
  })

  it('has meta definitions for all task types', () => {
    const allTypes = ['interaction', 'photo', 'question', 'focus', 'memory', 'random'] as const
    for (const type of allTypes) {
      expect(TASK_TYPE_META[type]).toBeDefined()
      expect(TASK_TYPE_META[type].label).toBeTruthy()
      expect(TASK_TYPE_META[type].icon).toBeTruthy()
    }
  })

  it('returns the identical task for the same date regardless of calls or renders', () => {
    const date1 = '2026-09-09'
    const taskA = getDailyTaskTemplate(date1)
    const taskB = getDailyTaskTemplate(date1)
    expect(taskA.id).toBe(taskB.id)
    expect(taskA.title).toBe(taskB.title)
    expect(taskA.task_type).toBe(taskB.task_type)
  })

  it('rotates task types on adjacent dates to avoid duplicate experiences', () => {
    const dates = ['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13']
    for (let i = 0; i < dates.length - 1; i++) {
      const current = getDailyTaskTemplate(dates[i])
      const next = getDailyTaskTemplate(dates[i + 1])
      expect(current.id).not.toBe(next.id)
      expect(current.task_type).not.toBe(next.task_type)
    }
  })

  it('computes business date in Asia/Shanghai timezone reliably', () => {
    // 2026-09-09 15:00:00 UTC is 2026-09-09 23:00:00 CST
    const eveningCST = new Date('2026-09-09T15:00:00Z')
    expect(getBusinessDate(eveningCST)).toBe('2026-09-09')

    // 2026-09-09 17:00:00 UTC is 2026-09-10 01:00:00 CST (next day in CST)
    const afterMidnightCST = new Date('2026-09-09T17:00:00Z')
    expect(getBusinessDate(afterMidnightCST)).toBe('2026-09-10')
  })

  it('calculates gentle streak correctly', () => {
    const today = '2026-09-09'
    const mockHistory: DailyTaskHistoryItem[] = [
      {
        task: {
          id: '1',
          couple_id: 'c1',
          task_date: '2026-09-09',
          title: '任务1',
          description: '',
          task_type: 'interaction',
          created_at: '',
        },
        myCompletion: {
          id: 'c1',
          couple_id: 'c1',
          task_id: '1',
          user_id: 'u1',
          completed_at: '',
          optional_content: '',
        },
        partnerCompletion: null,
        isAllCompleted: false,
      },
      {
        task: {
          id: '2',
          couple_id: 'c1',
          task_date: '2026-09-08',
          title: '任务2',
          description: '',
          task_type: 'question',
          created_at: '',
        },
        myCompletion: null,
        partnerCompletion: {
          id: 'c2',
          couple_id: 'c1',
          task_id: '2',
          user_id: 'u2',
          completed_at: '',
          optional_content: '',
        },
        isAllCompleted: false,
      },
      {
        task: {
          id: '3',
          couple_id: 'c1',
          task_date: '2026-09-07',
          title: '任务3',
          description: '',
          task_type: 'photo',
          created_at: '',
        },
        myCompletion: {
          id: 'c3',
          couple_id: 'c1',
          task_id: '3',
          user_id: 'u1',
          completed_at: '',
          optional_content: '',
        },
        partnerCompletion: null,
        isAllCompleted: false,
      },
    ]

    const streak = calculateStreak(mockHistory, today)
    expect(streak.currentStreak).toBe(3)
    expect(streak.totalCompletedDays).toBe(3)
    expect(streak.lastCompletedDate).toBe('2026-09-09')

    // When today is not yet completed, but yesterday was, streak remains active
    const pendingTodayHistory = mockHistory.slice(1) // only 09-08 and 09-07
    const pendingTodayStreak = calculateStreak(pendingTodayHistory, today)
    expect(pendingTodayStreak.currentStreak).toBe(2)
  })
})
