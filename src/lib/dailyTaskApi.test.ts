import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  completeDailyTask,
  ensureDailyTask,
  loadDailyTaskForDate,
  loadDailyTaskHistory,
} from './dailyTaskApi'
import { getDailyTaskTemplate } from './dailyTaskPool'

describe('dailyTaskApi demo mode and validation', () => {
  const coupleId = 'demo-couple'
  const myUserId = 'demo-user-1'
  const partnerUserId = 'demo-user-2'
  const date = '2026-09-09'
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) || null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    })
  })

  it('ensures daily task idempotently in demo mode', async () => {
    const template = getDailyTaskTemplate(date)
    const task1 = await ensureDailyTask(coupleId, date, template, true)
    expect(task1.task_date).toBe(date)
    expect(task1.title).toBe(template.title)

    // Call again for same date -> returns exact same task
    const task2 = await ensureDailyTask(coupleId, date, template, true)
    expect(task2.id).toBe(task1.id)
  })

  it('loads today task with correct completion states', async () => {
    const detailBefore = await loadDailyTaskForDate(coupleId, date, myUserId, partnerUserId, true)
    expect(detailBefore).not.toBeNull()
    expect(detailBefore?.isCompletedByMe).toBe(false)
    expect(detailBefore?.isCompletedByPartner).toBe(false)
    expect(detailBefore?.isAllCompleted).toBe(false)

    // Complete by myUserId
    await completeDailyTask(coupleId, detailBefore!.task.id, myUserId, '今天真好', true)

    const detailAfterMe = await loadDailyTaskForDate(coupleId, date, myUserId, partnerUserId, true)
    expect(detailAfterMe?.isCompletedByMe).toBe(true)
    expect(detailAfterMe?.isCompletedByPartner).toBe(false)
    expect(detailAfterMe?.isAllCompleted).toBe(false)
    expect(detailAfterMe?.myCompletion?.optional_content).toBe('今天真好')

    // Complete by partnerUserId
    await completeDailyTask(coupleId, detailBefore!.task.id, partnerUserId, '我也觉得', true)

    const detailAfterBoth = await loadDailyTaskForDate(
      coupleId,
      date,
      myUserId,
      partnerUserId,
      true,
    )
    expect(detailAfterBoth?.isCompletedByMe).toBe(true)
    expect(detailAfterBoth?.isCompletedByPartner).toBe(true)
    expect(detailAfterBoth?.isAllCompleted).toBe(true)
  })

  it('updates answer without creating duplicate completion record', async () => {
    const template = getDailyTaskTemplate(date)
    const task = await ensureDailyTask(coupleId, date, template, true)

    const firstComp = await completeDailyTask(coupleId, task.id, myUserId, '初版回答', true)
    expect(firstComp.optional_content).toBe('初版回答')

    const secondComp = await completeDailyTask(coupleId, task.id, myUserId, '修改后的回答', true)
    expect(secondComp.optional_content).toBe('修改后的回答')
    expect(secondComp.id).toBe(firstComp.id)
  })

  it('rejects optional_content exceeding 1000 characters', async () => {
    const template = getDailyTaskTemplate(date)
    const task = await ensureDailyTask(coupleId, date, template, true)
    const tooLong = 'x'.repeat(1001)
    await expect(completeDailyTask(coupleId, task.id, myUserId, tooLong, true)).rejects.toThrow(
      '1000',
    )
  })

  it('loads history in descending date order', async () => {
    const t1 = getDailyTaskTemplate('2026-09-08')
    const t2 = getDailyTaskTemplate('2026-09-09')
    await ensureDailyTask(coupleId, '2026-09-08', t1, true)
    await ensureDailyTask(coupleId, '2026-09-09', t2, true)

    const history = await loadDailyTaskHistory(coupleId, myUserId, partnerUserId, 10, true)
    expect(history.length).toBe(2)
    expect(history[0].task.task_date).toBe('2026-09-09')
    expect(history[1].task.task_date).toBe('2026-09-08')
  })
})
