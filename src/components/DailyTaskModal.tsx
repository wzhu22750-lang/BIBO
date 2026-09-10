import { useState } from 'react'
import { Button, Modal } from './ui'
import { Icon } from './PixelArt'
import type { DailyTaskDetail } from '../lib/dailyTaskTypes'
import { TASK_TYPE_META } from '../lib/dailyTaskPool'
import type { Page } from '../lib/types'

export function DailyTaskModal({
  detail,
  partnerName,
  busy,
  onComplete,
  onClose,
  navigate,
}: {
  detail: DailyTaskDetail
  partnerName?: string
  busy: boolean
  onComplete: (content?: string) => Promise<boolean>
  onClose: () => void
  navigate?: (page: Page) => void
}) {
  const { task, myCompletion, partnerCompletion, isCompletedByMe } = detail
  const meta = TASK_TYPE_META[task.task_type] || {
    label: '日常互动',
    icon: 'heart',
    tone: 'yellow' as const,
  }

  const [inputContent, setInputContent] = useState(myCompletion?.optional_content || '')
  const [completedSuccess, setCompletedSuccess] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const success = await onComplete(inputContent)
    if (success) {
      setCompletedSuccess(true)
      setTimeout(() => {
        onClose()
      }, 600)
    }
  }

  return (
    <Modal title="今日小任务" onClose={onClose} className="daily-task-modal">
      <div className="daily-task-modal-body">
        <div className="daily-task-meta-bar">
          <span className={`daily-task-badge tone-${meta.tone}`}>
            <Icon name={meta.icon as any} size={14} />
            {meta.label}
          </span>
          <span className="micro muted">DATE: {task.task_date}</span>
        </div>

        <h3 className="daily-task-modal-title">{task.title}</h3>
        {task.description && <p className="daily-task-modal-desc">{task.description}</p>}

        {/* 对方完成状态与回答（若有） */}
        <div className="daily-task-partner-status">
          <div className="status-indicator-row">
            <span className="player-name">{partnerName || '对方'}：</span>
            {partnerCompletion ? (
              <span className="status-tag completed">
                <Icon name="check" size={14} /> 已完成
              </span>
            ) : (
              <span className="status-tag pending">○ 等待完成中</span>
            )}
          </div>
          {partnerCompletion?.optional_content && (
            <div className="partner-answer-bubble">
              <span className="micro">TA 的回答：</span>
              <p>{partnerCompletion.optional_content}</p>
            </div>
          )}
        </div>

        {/* 本人完成或输入区域 */}
        <form onSubmit={handleSubmit} className="daily-task-form">
          {task.task_type === 'question' ||
          task.task_type === 'memory' ||
          task.task_type === 'random' ||
          task.task_type === 'interaction' ? (
            <label className="daily-task-input-label">
              <span>你的回答或心意碎碎念（选填）：</span>
              <textarea
                rows={3}
                maxLength={500}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="留下今天的答案或想说的一句话…"
              />
            </label>
          ) : null}

          {task.task_type === 'photo' && (
            <div className="daily-task-tip-box">
              <Icon name="photo" size={20} />
              <div>
                <b>随手拍提醒</b>
                <p>拍好照片后，可以存入你们的照片墙，或在此写下拍照心得。</p>
              </div>
              {navigate && (
                <Button
                  type="button"
                  tone="green"
                  onClick={() => {
                    onClose()
                    navigate('photos')
                  }}
                >
                  去照片墙 <Icon name="arrow" size={14} />
                </Button>
              )}
            </div>
          )}

          {task.task_type === 'focus' && (
            <div className="daily-task-tip-box">
              <Icon name="focus" size={20} />
              <div>
                <b>专注陪伴提醒</b>
                <p>可以前往专注页面开启计时，或者在现实中安静陪伴后点击完成。</p>
              </div>
              {navigate && (
                <Button
                  type="button"
                  tone="blue"
                  onClick={() => {
                    onClose()
                    navigate('focus')
                  }}
                >
                  开启专注 <Icon name="arrow" size={14} />
                </Button>
              )}
            </div>
          )}

          <div className="modal-actions-row">
            <Button type="button" tone="white" onClick={onClose} disabled={busy}>
              取消
            </Button>
            <Button type="submit" tone={isCompletedByMe ? 'green' : 'yellow'} disabled={busy}>
              {busy ? (
                '正在保存…'
              ) : completedSuccess ? (
                '已完成！'
              ) : isCompletedByMe ? (
                <>
                  更新回答 <Icon name="check" size={16} />
                </>
              ) : (
                <>
                  完成今日任务 <Icon name="check" size={16} />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
