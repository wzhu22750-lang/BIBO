import { db, must } from './supabase'
import type {
  DailyTask,
  DailyTaskCompletion,
  DailyTaskDetail,
  DailyTaskHistoryItem,
  DailyTaskTemplate,
} from './dailyTaskTypes'
import { getDailyTaskTemplate } from './dailyTaskPool'

const DEMO_TASKS_KEY = 'bibu-demo-daily-tasks'
const DEMO_COMPLETIONS_KEY = 'bibu-demo-daily-completions'

function readDemoTasks(): DailyTask[] {
  try {
    const raw = localStorage.getItem(DEMO_TASKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDemoTasks(tasks: DailyTask[]) {
  try {
    localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(tasks))
  } catch {
    /* ignore quota */
  }
}

function readDemoCompletions(): DailyTaskCompletion[] {
  try {
    const raw = localStorage.getItem(DEMO_COMPLETIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDemoCompletions(comps: DailyTaskCompletion[]) {
  try {
    localStorage.setItem(DEMO_COMPLETIONS_KEY, JSON.stringify(comps))
  } catch {
    /* ignore quota */
  }
}

/**
 * 确保某天的任务存在于数据库中（若不存在则原子创建，若已存在则直接返回）
 */
export async function ensureDailyTask(
  coupleId: string,
  taskDate: string,
  template: DailyTaskTemplate,
  demo = false,
): Promise<DailyTask> {
  if (demo) {
    const tasks = readDemoTasks()
    const existing = tasks.find((t) => t.couple_id === coupleId && t.task_date === taskDate)
    if (existing) return existing

    const newTask: DailyTask = {
      id: `demo-task-${taskDate}`,
      couple_id: coupleId,
      task_date: taskDate,
      title: template.title,
      description: template.description,
      task_type: template.task_type,
      created_at: new Date().toISOString(),
    }
    tasks.push(newTask)
    saveDemoTasks(tasks)
    return newTask
  }

  // 1. 优先调用原子 RPC
  try {
    const res = await db().rpc('ensure_daily_task', {
      p_date: taskDate,
      p_title: template.title,
      p_description: template.description,
      p_task_type: template.task_type,
    })
    if (!res.error && res.data) {
      return res.data as DailyTask
    }
  } catch {
    // 降级使用普通 select / insert
  }

  // 2. 降级安全路径：先查
  const query = await db()
    .from('daily_tasks')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('task_date', taskDate)
    .maybeSingle()

  if (query.data) {
    return query.data as DailyTask
  }

  // 3. 不存在时插入（由 unique(couple_id, task_date) 保证幂等防重复）
  const inserted = await db()
    .from('daily_tasks')
    .insert({
      couple_id: coupleId,
      task_date: taskDate,
      title: template.title,
      description: template.description,
      task_type: template.task_type,
    })
    .select()
    .single()

  if (inserted.error) {
    // 若因并发 conflict，重新查询
    const fallback = await db()
      .from('daily_tasks')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('task_date', taskDate)
      .single()
    return must(fallback) as DailyTask
  }

  return inserted.data as DailyTask
}

/**
 * 加载特定日期的任务及其双方完成详情
 */
export async function loadDailyTaskForDate(
  coupleId: string,
  taskDate: string,
  myUserId: string,
  partnerUserId?: string,
  demo = false,
  signal?: AbortSignal,
): Promise<DailyTaskDetail | null> {
  const template = getDailyTaskTemplate(taskDate)
  const task = await ensureDailyTask(coupleId, taskDate, template, demo)

  if (demo) {
    const comps = readDemoCompletions().filter((c) => c.task_id === task.id)
    const myCompletion = comps.find((c) => c.user_id === myUserId) || null
    const partnerCompletion = partnerUserId
      ? comps.find((c) => c.user_id === partnerUserId) || null
      : null
    return {
      task,
      myCompletion,
      partnerCompletion,
      isCompletedByMe: myCompletion !== null,
      isCompletedByPartner: partnerCompletion !== null,
      isAllCompleted: myCompletion !== null && (partnerUserId ? partnerCompletion !== null : true),
    }
  }

  const abort = signal || new AbortController().signal
  const compsQuery = await db()
    .from('daily_task_completions')
    .select('*')
    .eq('task_id', task.id)
    .abortSignal(abort)

  if (compsQuery.error) throw compsQuery.error

  const completions = (compsQuery.data || []) as DailyTaskCompletion[]
  const myCompletion = completions.find((c) => c.user_id === myUserId) || null
  const partnerCompletion = partnerUserId
    ? completions.find((c) => c.user_id === partnerUserId) || null
    : null

  return {
    task,
    myCompletion,
    partnerCompletion,
    isCompletedByMe: myCompletion !== null,
    isCompletedByPartner: partnerCompletion !== null,
    isAllCompleted: myCompletion !== null && (partnerUserId ? partnerCompletion !== null : true),
  }
}

/**
 * 用户完成每日任务
 */
export async function completeDailyTask(
  coupleId: string,
  taskId: string,
  myUserId: string,
  optionalContent = '',
  demo = false,
): Promise<DailyTaskCompletion> {
  const content = optionalContent.trim()
  if (content.length > 1000) {
    throw new Error('回答内容不能超过 1000 字')
  }

  if (demo) {
    const comps = readDemoCompletions()
    const index = comps.findIndex((c) => c.task_id === taskId && c.user_id === myUserId)
    const now = new Date().toISOString()
    if (index >= 0) {
      comps[index].optional_content = content
      comps[index].completed_at = now
      saveDemoCompletions(comps)
      return comps[index]
    }
    const created: DailyTaskCompletion = {
      id: `demo-comp-${Date.now()}`,
      couple_id: coupleId,
      task_id: taskId,
      user_id: myUserId,
      completed_at: now,
      optional_content: content,
    }
    comps.push(created)
    saveDemoCompletions(comps)
    return created
  }

  // 1. 优先调用原子 RPC
  try {
    const res = await db().rpc('complete_daily_task', {
      p_task_id: taskId,
      p_content: content,
    })
    if (!res.error && res.data) {
      return res.data as DailyTaskCompletion
    }
  } catch {
    // 降级
  }

  // 2. 降级直接 upsert
  const query = await db()
    .from('daily_task_completions')
    .upsert(
      {
        couple_id: coupleId,
        task_id: taskId,
        user_id: myUserId,
        optional_content: content,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'task_id,user_id' },
    )
    .select()
    .single()

  if (query.error) throw query.error
  return query.data as DailyTaskCompletion
}

/**
 * 加载最近历史任务（支持最近 14~30 天）
 */
export async function loadDailyTaskHistory(
  coupleId: string,
  myUserId: string,
  partnerUserId?: string,
  limit = 14,
  demo = false,
  signal?: AbortSignal,
): Promise<DailyTaskHistoryItem[]> {
  if (demo) {
    const tasks = readDemoTasks().filter((t) => t.couple_id === coupleId)
    const comps = readDemoCompletions()
    const sorted = [...tasks].sort((a, b) => b.task_date.localeCompare(a.task_date)).slice(0, limit)
    return sorted.map((task) => {
      const taskComps = comps.filter((c) => c.task_id === task.id)
      const myCompletion = taskComps.find((c) => c.user_id === myUserId) || null
      const partnerCompletion = partnerUserId
        ? taskComps.find((c) => c.user_id === partnerUserId) || null
        : null
      return {
        task,
        myCompletion,
        partnerCompletion,
        isAllCompleted:
          myCompletion !== null && (partnerUserId ? partnerCompletion !== null : true),
      }
    })
  }

  const abort = signal || new AbortController().signal
  const tasksQuery = await db()
    .from('daily_tasks')
    .select('*')
    .eq('couple_id', coupleId)
    .order('task_date', { ascending: false })
    .limit(limit)
    .abortSignal(abort)

  if (tasksQuery.error) throw tasksQuery.error
  const tasks = (tasksQuery.data || []) as DailyTask[]
  if (tasks.length === 0) return []

  const taskIds = tasks.map((t) => t.id)
  const compsQuery = await db()
    .from('daily_task_completions')
    .select('*')
    .in('task_id', taskIds)
    .abortSignal(abort)

  if (compsQuery.error) throw compsQuery.error
  const completions = (compsQuery.data || []) as DailyTaskCompletion[]

  return tasks.map((task) => {
    const taskComps = completions.filter((c) => c.task_id === task.id)
    const myCompletion = taskComps.find((c) => c.user_id === myUserId) || null
    const partnerCompletion = partnerUserId
      ? taskComps.find((c) => c.user_id === partnerUserId) || null
      : null
    return {
      task,
      myCompletion,
      partnerCompletion,
      isAllCompleted: myCompletion !== null && (partnerUserId ? partnerCompletion !== null : true),
    }
  })
}
