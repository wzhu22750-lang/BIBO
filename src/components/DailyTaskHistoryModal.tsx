import { Modal, Empty } from './ui'
import { Icon } from './PixelArt'
import type { DailyTaskHistoryItem, DailyTaskStreak } from '../lib/dailyTaskTypes'
import { TASK_TYPE_META } from '../lib/dailyTaskPool'

export function DailyTaskHistoryModal({
  history,
  streak,
  partnerName,
  loading,
  onClose,
}: {
  history: DailyTaskHistoryItem[]
  streak: DailyTaskStreak
  partnerName?: string
  loading: boolean
  onClose: () => void
}) {
  return (
    <Modal title="每日任务历史" onClose={onClose} className="daily-task-history-modal">
      <div className="daily-task-history-body">
        {/* 轻量连续统计 */}
        <div className="history-streak-card">
          <div className="streak-main">
            <span className="micro">STREAK & MOMENTS</span>
            <div className="streak-numbers">
              <span className="streak-highlight">
                <Icon name="spark" size={18} />
                连续互动 <strong>{streak.currentStreak}</strong> 天
              </span>
              <span className="streak-total">
                累计完成 <strong>{streak.totalCompletedDays}</strong> 次
              </span>
            </div>
          </div>
          <p className="micro muted">只要有一人打卡即保留互动习惯，没有打卡惩罚，慢慢来就好。</p>
        </div>

        {/* 历史任务列表 */}
        {loading ? (
          <div className="history-loading micro">正在读取历史任务记录…</div>
        ) : history.length === 0 ? (
          <Empty title="暂无历史记录" description="今天的小任务是你们的第一站。" />
        ) : (
          <div className="history-list">
            {history.map((item) => {
              const meta = TASK_TYPE_META[item.task.task_type] || {
                label: '互动',
                icon: 'heart',
                tone: 'yellow' as const,
              }
              const isMeDone = item.myCompletion !== null
              const isPartnerDone = item.partnerCompletion !== null
              const isBothDone = isMeDone && isPartnerDone

              return (
                <div key={item.task.id} className="history-item-card">
                  <div className="history-item-header">
                    <span className="history-item-date">{item.task.task_date}</span>
                    <span className={`daily-task-badge micro tone-${meta.tone}`}>
                      <Icon name={meta.icon as any} size={12} />
                      {meta.label}
                    </span>
                  </div>

                  <h4 className="history-item-title">{item.task.title}</h4>

                  <div className="history-item-status-row">
                    <div className="status-tags-group">
                      <span className={`status-pill ${isMeDone ? 'done' : 'wait'}`}>
                        你：{isMeDone ? '✓ 完成' : '○ 未完成'}
                      </span>
                      <span className={`status-pill ${isPartnerDone ? 'done' : 'wait'}`}>
                        {partnerName || '对方'}：{isPartnerDone ? '✓ 完成' : '○ 未完成'}
                      </span>
                    </div>

                    {isBothDone && (
                      <span className="both-done-badge">
                        <Icon name="star" size={12} /> 共同完成
                      </span>
                    )}
                  </div>

                  {item.myCompletion?.optional_content && (
                    <div className="history-note my-note">
                      <small>你的回答：{item.myCompletion.optional_content}</small>
                    </div>
                  )}

                  {item.partnerCompletion?.optional_content && (
                    <div className="history-note partner-note">
                      <small>
                        {partnerName || '对方'}的回答：
                        {item.partnerCompletion.optional_content}
                      </small>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
