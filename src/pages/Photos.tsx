import { useState } from 'react'
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
          {dateLabel(photo.created_at)}
          <Icon name="heart" size={12} />
        </span>
      </div>
    </button>
  )
}
export function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <Modal title="MEMORY UNLOCKED" onClose={onClose} className="photo-modal">
      {photo.url ? (
        <img className="full-photo" src={photo.url} alt={photo.caption || '照片大图'} />
      ) : (
        <Empty title="照片暂不可用" description="请关闭后刷新页面重新获取访问链接。" />
      )}
      <div className="lightbox-caption">
        <h3>{photo.caption}</h3>
        <span>{dateLabel(photo.created_at)}</span>
      </div>
    </Modal>
  )
}
export function Photos({ controller, demo }: { controller: SpaceController; demo: boolean }) {
  const [selected, setSelected] = useState<Photo | null>(null),
    [adding, setAdding] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [caption, setCaption] = useState('')
  const { busy, run } = useTask(),
    toast = useToast(),
    photos = controller.space!.photos
  return (
    <>
      <PageHeading
        eyebrow="COLLECT MOMENTS, NOT THINGS"
        title="照片墙"
        subtitle="把日子过成一帧一帧，想念的时候就翻一翻。"
      >
        <Button tone="pink" onClick={() => setAdding(true)}>
          <Icon name="upload" size={18} />
          上传照片
        </Button>
      </PageHeading>
      <div className="collection-label">
        <span>
          <b>{String(photos.length).padStart(2, '0')}</b> 个被收藏的瞬间
        </span>
        <span className="micro">NEWEST FIRST ↓</span>
      </div>
      {photos.length ? (
        <div className="photos-grid">
          {photos.map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} index={i} onClick={() => setSelected(photo)} />
          ))}
        </div>
      ) : (
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
      {selected && <PhotoViewer photo={selected} onClose={() => setSelected(null)} />}{' '}
      {adding && (
        <Modal
          title="收藏一个小瞬间"
          onClose={() => {
            if (!busy) setAdding(false)
          }}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (file)
                void run(async () => {
                  await controller.upload(file, caption.trim())
                  setAdding(false)
                  setFile(null)
                  setCaption('')
                  toast('新的回忆，收藏成功！')
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
                onChange={(e) => setFile(e.target.files?.[0] || null)}
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
