import { PhotoOutboxPanel } from '../components/PhotoOutboxPanel'
import { usePhotoPages } from '../hooks/usePhotoPages'
import { referenceLink } from '../lib/routes'
import { readPhotoDate } from '../lib/photoDate'
import type { PhotoDateResult } from '../lib/photoDate'
import { MemoryFields } from '../components/MemoryFields'
import { memoryInput, memoryDateLabel, sortedMemories } from '../lib/memories'
import { useRef, useState } from 'react'
import type { Photo } from '../lib/types'
import type { SpaceController } from '../hooks/useSpace'
import { dateLabel } from '../lib/dates'
import { Button, Empty, Modal, PageHeading, useTask, useToast } from '../components/ui'
import { Icon } from '../components/PixelArt'
export function PhotoCard({
  photo,
  onClick,
  index = 0,
}: {
  photo: Photo
  onClick: () => void
  index?: number
}) {
  return (
    <button className={`photo-card photo-${index % 3}`} onClick={onClick}>
      <div className="photo-image">
        {photo.url ? (
          <img src={photo.url} alt={photo.caption || '我们的照片'} loading="lazy" />
        ) : (
          <span className="photo-unavailable">照片暂不可用，请刷新重试</span>
        )}
        <span className="photo-sticker">{['♥', '✳', '★'][index % 3]}</span>
      </div>
      <div className="photo-caption">
        <strong>{photo.caption || '又一个关于我们的瞬间'}</strong>
        <span>
          {memoryDateLabel(photo) || `上传于 ${dateLabel(photo.created_at)}`}
          <Icon name="heart" size={12} />
        </span>
      </div>
    </button>
  )
}
export function PhotoViewer({
  photo: original,
  onClose,
  controller,
}: {
  photo: Photo
  onClose: () => void
  controller?: SpaceController
}) {
  const [savedPhoto, setSavedPhoto] = useState<Photo | null>(null)
  const photo =
    savedPhoto || controller?.space?.photos.find((p) => p.id === original.id) || original
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [caption, setCaption] = useState(photo.caption)
  const [memory, setMemory] = useState(() => memoryInput(photo))
  const { busy, run } = useTask()
  const toast = useToast()
  const event = controller?.space?.events.find((e) => e.id === photo.event_id)
  const message = controller?.space?.messages.find((m) => m.id === photo.message_id)
  return (
    <Modal
      title="MEMORY UNLOCKED"
      onClose={() => {
        if (!busy) onClose()
      }}
      className="photo-modal"
    >
      {deleting && controller ? (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (confirmation !== '删除') return
            void run(async () => {
              await controller.deletePhoto(photo.id)
              toast('这份回忆及照片文件已删除')
              onClose()
            })
          }}
        >
          <h3>删除「{photo.caption || '这个瞬间'}」？</h3>
          <p>
            照片文件和回忆文字会从两个人的空间移除，不能撤销。关联事件与聊天消息不会删除。其他设备已下载的副本不受影响。
          </p>
          <label>
            输入“删除”确认
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <Button tone="pink" type="submit" disabled={busy || confirmation !== '删除'}>
            {busy ? '正在删除…' : '确认永久删除回忆'}
          </Button>
          <Button
            tone="white"
            type="button"
            disabled={busy}
            onClick={() => {
              setDeleting(false)
              setConfirmation('')
            }}
          >
            保留这份回忆
          </Button>
        </form>
      ) : editing && controller ? (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              const saved = await controller.updateMemory(photo.id, caption.trim(), memory)
              if (saved)
                setSavedPhoto({ ...saved, url: saved.path === photo.path ? photo.url : undefined })
              setEditing(false)
              toast('回忆已更新')
            })
          }}
        >
          <label>
            回忆标题
            <input maxLength={120} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </label>
          <MemoryFields value={memory} onChange={setMemory} space={controller.space!} />
          <Button type="submit" disabled={busy}>
            保存回忆
          </Button>
          <Button type="button" tone="white" disabled={busy} onClick={() => setEditing(false)}>
            取消编辑
          </Button>
        </form>
      ) : (
        <>
          {photo.url ? (
            <img className="full-photo" src={photo.url} alt={photo.caption || '照片大图'} />
          ) : (
            <Empty title="照片暂不可用" description="请关闭后刷新页面重新获取访问链接。" />
          )}
          <div className="lightbox-caption">
            <h3>{photo.caption}</h3>
            <span>
              {memoryDateLabel(photo) || '发生日期未记录'} · 上传于 {dateLabel(photo.created_at)}
            </span>
          </div>
          {photo.story && <p className="memory-story">{photo.story}</p>}
          {photo.event_id && (
            <p className="memory-link">
              关联事件：{event?.title || '当前列表未加载'} ·{' '}
              <a href={referenceLink('event', photo.event_id)} onClick={onClose}>
                去时间线
              </a>
            </p>
          )}
          {photo.message_id && (
            <div className="memory-link">
              关联悄悄话：
              <blockquote>{message?.content || '该消息不在当前已加载的聊天记录中'}</blockquote>
              <a href={referenceLink('message', photo.message_id)} onClick={onClose}>
                去悄悄话
              </a>
            </div>
          )}
          {controller?.space?.me.id === photo.uploaded_by && (
            <Button tone="pink" onClick={() => setDeleting(true)}>
              删除这份回忆
            </Button>
          )}
          {controller?.space?.me.id === photo.uploaded_by && (
            <Button
              tone="white"
              onClick={() => {
                setCaption(photo.caption)
                setMemory(memoryInput(photo))
                setEditing(true)
              }}
            >
              编辑回忆
            </Button>
          )}
        </>
      )}
    </Modal>
  )
}
export function Photos({ controller, demo }: { controller: SpaceController; demo: boolean }) {
  const [selected, setSelected] = useState<Photo | null>(null),
    [adding, setAdding] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [caption, setCaption] = useState(''),
    [memory, setMemory] = useState(() => memoryInput()),
    [photoDate, setPhotoDate] = useState<PhotoDateResult | null>(null),
    [eventFilter, setEventFilter] = useState('')
  const pickedFileRef = useRef<File | null>(null)
  const pages = usePhotoPages(
    controller.space!.couple!.id,
    eventFilter || null,
    !demo && !controller.cachedAt,
  )
  const { busy, run } = useTask(),
    toast = useToast(),
    photos =
      demo || controller.cachedAt
        ? sortedMemories(controller.space!.photos).filter(
            (p) => !eventFilter || p.event_id === eventFilter,
          )
        : pages.photos
  return (
    <>
      <PageHeading
        eyebrow="COLLECT MOMENTS, NOT THINGS"
        title="共同记忆"
        subtitle="把日子过成一帧一帧，想念的时候就翻一翻。"
      >
        <Button tone="pink" onClick={() => setAdding(true)}>
          <Icon name="upload" size={18} />
          上传照片
        </Button>
      </PageHeading>
      <label className="memory-filter">
        按事件看回忆
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="">全部共同记忆</option>
          {controller.space!.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </label>
      <div className="collection-label">
        <span>
          <b>{String(photos.length).padStart(2, '0')}</b>{' '}
          {demo || controller.cachedAt ? '个已加载瞬间' : '个本页瞬间'}
        </span>
        <span className="micro">OUR MEMORY TIMELINE ↓</span>
      </div>
      {!demo && <PhotoOutboxPanel controller={controller} />}
      {!demo && !controller.cachedAt && (
        <div className="memory-pagination">
          <Button
            tone="white"
            disabled={pages.busy || pages.pageNumber === 1}
            onClick={pages.previous}
          >
            上一页回忆
          </Button>
          <span>第 {pages.pageNumber} 页 · 按上传时间倒序，每页 30 张</span>
          <Button tone="white" disabled={pages.busy || !pages.hasMore} onClick={pages.next}>
            下一页回忆
          </Button>
          <Button tone="white" disabled={pages.busy} onClick={pages.refresh}>
            刷新当前页
          </Button>
          {pages.busy && <p role="status">正在读取回忆与私有图片链接…</p>}
          {pages.error && (
            <p role="alert">回忆读取失败：{pages.error}。可刷新重试，不会删除你的资料。</p>
          )}
        </div>
      )}
      {photos.length ? (
        <div className="photos-grid">
          {photos.map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} index={i} onClick={() => setSelected(photo)} />
          ))}
        </div>
      ) : pages.busy || pages.error ? null : (
        <Empty
          icon="📷"
          title="第一张照片，会是什么呢？"
          description="只对彼此开放的照片墙，等你放进第一个瞬间。"
        />
      )}
      <div className="pixel-note">
        <Icon name="lock" />
        <p>
          只属于两个人的回忆。
          <br />
          <span>
            {demo
              ? '当前为演示照片；新照片只保存在此浏览器，不会上传。'
              : '照片存放于私有存储桶，通过限时链接访问，不对外公开。'}
          </span>
        </p>
      </div>
      {selected && (
        <PhotoViewer
          key={selected.id}
          controller={controller}
          photo={selected}
          onClose={() => {
            setSelected(null)
            pages.refresh()
          }}
        />
      )}{' '}
      {adding && (
        <Modal
          title="收藏一个小瞬间"
          onClose={() => {
            if (!busy) setAdding(false)
            setPhotoDate(null)
            pickedFileRef.current = null
          }}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (file)
                void run(async () => {
                  const result = await controller.upload(file, caption.trim(), memory)
                  setAdding(false)
                  setFile(null)
                  setCaption('')
                  setMemory(memoryInput())
                  setPhotoDate(null)
                  pickedFileRef.current = null
                  pages.refresh()
                  toast(
                    result.queued
                      ? '照片已保存在本机，联网后同步到你们的空间'
                      : '新的回忆，收藏成功！',
                  )
                })
            }}
          >
            <label className="upload-zone">
              <Icon name="upload" size={36} />
              <strong>{file?.name || '点击选择一张照片'}</strong>
              <span>JPG / PNG / WebP · {demo ? '演示限 1.5 MB' : '最大 5 MB'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) => {
                  const next = e.target.files?.[0] || null
                  setFile(next)
                  if (next) {
                    pickedFileRef.current = next
                    setPhotoDate(null)
                    setMemory((current) => {
                      if (current.occurred_on) return current
                      void readPhotoDate(next).then((result) => {
                        if (pickedFileRef.current !== next) return
                        setPhotoDate(result)
                        // 用户已手动填过日期时，不再用照片信息覆盖
                        setMemory((latest) =>
                          latest.occurred_on ? latest : { ...latest, occurred_on: result.date },
                        )
                      })
                      return current
                    })
                  } else {
                    pickedFileRef.current = null
                    setPhotoDate(null)
                  }
                }}
              />
            </label>
            <label>
              写一句关于这一天的话
              <input
                maxLength={120}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="比如：今天的夕阳和你都很好看"
              />
            </label>
            <MemoryFields value={memory} onChange={setMemory} space={controller.space!} />
            {photoDate && (
              <p className="form-note" role="status">
                {photoDate.date
                  ? `已从${photoDate.source === 'exif' ? '照片的拍摄时间' : '文件时间'}自动填入「${photoDate.date}」，可再手动修改或清空。`
                  : '未识别到可信的拍摄日期，可手动填写。'}
              </p>
            )}
            <p className="form-note">请勿上传敏感证件。MVP 不会自动移除照片的 EXIF 元数据。</p>
            <Button type="submit" tone="green" disabled={busy || !file}>
              {busy ? '正在收藏，请稍等…' : '放进我们的照片墙'}
            </Button>
          </form>
        </Modal>
      )}
    </>
  )
}
