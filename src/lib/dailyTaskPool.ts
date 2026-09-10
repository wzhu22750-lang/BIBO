import type {
  DailyTaskHistoryItem,
  DailyTaskStreak,
  DailyTaskTemplate,
  DailyTaskType,
} from './dailyTaskTypes'
import { DAILY_TASK_POOL } from './dailyTaskPoolData'

export { DAILY_TASK_POOL }

export function getBusinessDate(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(date)
  } catch {
    // 降级使用本地年月日
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
}

/**
 * 根据日期字符串 (YYYY-MM-DD) 确定性获取当天的任务模板
 * 一年 365 天，每天一道专属任务：
 * 1. 同一天所有用户必定获取到相同的任务
 * 2. 刷新页面不会重新随机
 * 3. 按照每年 365 天递增映射，每天一道题，一年 365 天永不重样
 * 4. 相邻日期由于池中任务的交替编排，类型自动切换，绝不重复单调
 */
export function getDailyTaskTemplate(dateStr: string): DailyTaskTemplate {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year || 2026, (month || 1) - 1, day || 1))
  const startOfYear = new Date(Date.UTC(year || 2026, 0, 1))
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000)
  const index = Math.abs(dayOfYear) % DAILY_TASK_POOL.length
  return DAILY_TASK_POOL[index]
}

/**
 * 任务类型对应的中文名称和图标配置
 */
export const TASK_TYPE_META: Record<
  DailyTaskType,
  { label: string; icon: string; tone: 'yellow' | 'pink' | 'green' | 'blue' | 'white' }
> = {
  interaction: { label: '互动表达', icon: 'heart', tone: 'pink' },
  question: { label: '真心小问', icon: 'chat', tone: 'yellow' },
  photo: { label: '随手拍', icon: 'photo', tone: 'green' },
  focus: { label: '专注陪伴', icon: 'focus', tone: 'blue' },
  memory: { label: '旧日回忆', icon: 'star', tone: 'pink' },
  random: { label: '趣味脑洞', icon: 'spark', tone: 'yellow' },
}

/**
 * 计算轻量连续完成天数（streak）
 * 不制造打卡压力，只要某一天双方或单方完成即记为有效互动
 */
export function calculateStreak(
  history: DailyTaskHistoryItem[],
  todayDateStr: string,
): DailyTaskStreak {
  if (!history || history.length === 0) {
    return { currentStreak: 0, totalCompletedDays: 0, lastCompletedDate: null }
  }

  // 按日期降序排序
  const sorted = [...history].sort((a, b) => b.task.task_date.localeCompare(a.task.task_date))

  let totalCompletedDays = 0
  let currentStreak = 0
  let lastCompletedDate: string | null = null

  // 只要两人中有一人完成或者都完成，就算这一天完成
  const completedItems = sorted.filter(
    (item) => item.myCompletion !== null || item.partnerCompletion !== null,
  )
  totalCompletedDays = completedItems.length

  if (completedItems.length > 0) {
    lastCompletedDate = completedItems[0].task.task_date
  }

  // 连续天数：从今天或昨天往回算
  // 解析 todayDate
  let checkDate = new Date(todayDateStr + 'T00:00:00Z')
  const completedDateMap = new Set(completedItems.map((item) => item.task.task_date))

  // 如果今天还没完成，但昨天完成了，streak 允许延续
  if (!completedDateMap.has(todayDateStr)) {
    checkDate = new Date(checkDate.getTime() - 86400000)
  }

  while (true) {
    const y = checkDate.getUTCFullYear()
    const m = String(checkDate.getUTCMonth() + 1).padStart(2, '0')
    const d = String(checkDate.getUTCDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`

    if (completedDateMap.has(key)) {
      currentStreak++
      checkDate = new Date(checkDate.getTime() - 86400000)
    } else {
      break
    }
  }

  return {
    currentStreak,
    totalCompletedDays,
    lastCompletedDate,
  }
}
