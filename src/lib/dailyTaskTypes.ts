export type DailyTaskType = 'interaction' | 'photo' | 'question' | 'focus' | 'memory' | 'random'

export type DailyTaskActionType = 'done' | 'input' | 'photo' | 'focus'

export interface DailyTaskTemplate {
  id: string
  title: string
  description: string
  task_type: DailyTaskType
  action_type: DailyTaskActionType
  category: string
  prompt_hint?: string
}

export interface DailyTask {
  id: string
  couple_id: string
  task_date: string // YYYY-MM-DD
  title: string
  description: string
  task_type: DailyTaskType
  created_at: string
}

export interface DailyTaskCompletion {
  id: string
  couple_id: string
  task_id: string
  user_id: string
  completed_at: string
  optional_content: string
}

export interface DailyTaskDetail {
  task: DailyTask
  myCompletion: DailyTaskCompletion | null
  partnerCompletion: DailyTaskCompletion | null
  isCompletedByMe: boolean
  isCompletedByPartner: boolean
  isAllCompleted: boolean
}

export interface DailyTaskHistoryItem {
  task: DailyTask
  myCompletion: DailyTaskCompletion | null
  partnerCompletion: DailyTaskCompletion | null
  isAllCompleted: boolean
}

export interface DailyTaskStreak {
  currentStreak: number
  totalCompletedDays: number
  lastCompletedDate: string | null
}
