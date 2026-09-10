import { useCallback, useEffect, useRef, useState } from 'react'
import type { DailyTaskDetail, DailyTaskHistoryItem, DailyTaskStreak } from '../lib/dailyTaskTypes'
import { completeDailyTask, loadDailyTaskForDate, loadDailyTaskHistory } from '../lib/dailyTaskApi'
import { calculateStreak, getBusinessDate } from '../lib/dailyTaskPool'
import { errorText } from '../lib/supabase'

export function useDailyTask({
  coupleId,
  myUserId,
  partnerUserId,
  demo = false,
  reloadKey,
}: {
  coupleId: string | undefined
  myUserId: string | undefined
  partnerUserId?: string
  demo?: boolean
  reloadKey?: unknown
}) {
  const [detail, setDetail] = useState<DailyTaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<DailyTaskHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const activeDateRef = useRef(getBusinessDate())
  const loadingLock = useRef(false)
  const isMounted = useRef(true)

  const loadToday = useCallback(async () => {
    if (!coupleId || !myUserId) {
      setLoading(false)
      return
    }
    const today = getBusinessDate()
    activeDateRef.current = today
    if (loadingLock.current) return
    loadingLock.current = true

    try {
      const data = await loadDailyTaskForDate(coupleId, today, myUserId, partnerUserId, demo)
      if (isMounted.current) {
        setDetail(data)
        setError('')
      }
    } catch (err) {
      if (isMounted.current) {
        setError(errorText(err))
      }
    } finally {
      loadingLock.current = false
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [coupleId, myUserId, partnerUserId, demo])

  // 1. 当 coupleId、myUserId、partnerUserId 或 reloadKey（如 Realtime 同步更新）变更时加载
  useEffect(() => {
    isMounted.current = true
    void loadToday()
    return () => {
      isMounted.current = false
    }
  }, [loadToday, reloadKey])

  // 2. 跨天自动检测（夜间 0 点或 App 从后台恢复时）
  useEffect(() => {
    function checkMidnight() {
      const current = getBusinessDate()
      if (current !== activeDateRef.current && !document.hidden) {
        activeDateRef.current = current
        void loadToday()
      }
    }

    const timer = setInterval(checkMidnight, 30000)
    document.addEventListener('visibilitychange', checkMidnight)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', checkMidnight)
    }
  }, [loadToday])

  // 3. Demo 模式跨标签页同步
  useEffect(() => {
    if (!demo) return
    function handleStorage(e: StorageEvent) {
      if (
        e.key === 'bibu-demo-daily-tasks' ||
        e.key === 'bibu-demo-daily-completions' ||
        e.key === null
      ) {
        void loadToday()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [demo, loadToday])

  // 4. 完成任务
  const complete = useCallback(
    async (optionalContent = ''): Promise<boolean> => {
      if (!coupleId || !myUserId || !detail?.task) return false
      setBusy(true)
      try {
        const comp = await completeDailyTask(
          coupleId,
          detail.task.id,
          myUserId,
          optionalContent,
          demo,
        )

        // 乐观更新或直接组装新 detail
        const isPartnerDone = detail.partnerCompletion !== null
        const nextDetail: DailyTaskDetail = {
          ...detail,
          myCompletion: comp,
          isCompletedByMe: true,
          isAllCompleted: isPartnerDone,
        }
        setDetail(nextDetail)
        setCelebrating(true)

        // 刷新历史记录以更新 streak
        void loadHistory()
        return true
      } catch (err) {
        setError(errorText(err))
        return false
      } finally {
        setBusy(false)
      }
    },
    [coupleId, myUserId, detail, demo],
  )

  // 5. 加载历史记录
  const loadHistory = useCallback(async () => {
    if (!coupleId || !myUserId) return
    setHistoryLoading(true)
    try {
      const list = await loadDailyTaskHistory(coupleId, myUserId, partnerUserId, 20, demo)
      if (isMounted.current) {
        setHistory(list)
      }
    } catch {
      // ignore
    } finally {
      if (isMounted.current) {
        setHistoryLoading(false)
      }
    }
  }, [coupleId, myUserId, partnerUserId, demo])

  // 初始时也自动加载一次历史用于计算连续天数
  useEffect(() => {
    if (coupleId && myUserId) {
      void loadHistory()
    }
  }, [loadHistory, coupleId, myUserId])

  const streak: DailyTaskStreak = calculateStreak(
    history.length > 0
      ? history
      : detail
        ? [
            {
              task: detail.task,
              myCompletion: detail.myCompletion,
              partnerCompletion: detail.partnerCompletion,
              isAllCompleted: detail.isAllCompleted,
            },
          ]
        : [],
    getBusinessDate(),
  )

  return {
    detail,
    loading,
    busy,
    error,
    history,
    historyLoading,
    streak,
    celebrating,
    dismissCelebration: () => setCelebrating(false),
    completeTask: complete,
    loadHistory,
    reload: loadToday,
  }
}
