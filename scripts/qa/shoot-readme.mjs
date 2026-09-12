// README 配图生成器：demo 模式真实截图，落到 docs/media/。
// 用法：npm run dev 起在 5173（或传 baseURL），然后 node scripts/qa/shoot-readme.mjs [baseURL]
// 每一张都先断言页面标记，确保图片内容与文件名一致，不会拍错页面。
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = 'docs/media'
mkdirSync(OUT, { recursive: true })
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const SHOTS = [
  { name: 'home', hash: 'home', wait: ['.together-card', '.day-counter'], label: '小窝 · 恋爱天数与像素小伙伴' },
  { name: 'photos', hash: 'photos', wait: ['.photos-grid .photo-card', '.memory-order-toggle'], label: '照片墙 · 回忆时间可正序/倒序' },
  { name: 'chat', hash: 'chat', wait: ['.chat-window', '.message-bubble'], label: '悄悄话' },
  { name: 'wardrobe', hash: 'wardrobe', wait: ['.wardrobe-split-view'], label: '萌宠衣橱' },
]

function cdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl)
  const pending = new Map()
  let id = 0
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    }
  }
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  return { send, ready: new Promise((r) => (ws.onopen = r)) }
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=9446',
    '--user-data-dir=/tmp/qa-chrome-readme',
    '--no-first-run',
    '--window-size=430,930',
    'about:blank',
  ])
  chrome.stderr.on('data', () => {})
  await sleep(1500)
  const version = await (await fetch('http://127.0.0.1:9446/json/version')).json()
  const browser = cdpClient(version.webSocketDebuggerUrl)
  await browser.ready
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true })
  const S = (m, p) => browser.send(m, p, sessionId)
  await S('Page.enable')
  await S('Runtime.enable')
  await S('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 930,
    deviceScaleFactor: 2,
    mobile: true,
  })
  const evalJs = async (expression) =>
    (await S('Runtime.evaluate', { expression, returnByValue: true })).result?.value

  await S('Page.navigate', { url: BASE + '/#home' })
  await sleep(2500)
  for (let i = 0; i < 20; i++) {
    const clicked = await evalJs(
      `(() => { const b=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('进入本地演示')); if(b){b.click(); return 'clicked'} return 'notfound' })()`,
    )
    if (clicked === 'clicked') break
    await sleep(500)
  }
  await sleep(2000)
  // 关掉可能弹出的一次性提示，避免遮挡截图
  await evalJs(
    `[...document.querySelectorAll('button')].filter(b=>/知道了|关闭|知道了|好/.test(b.textContent||'')).forEach(b=>b.click())`,
  )
  await sleep(500)

  for (const shot of SHOTS) {
    await evalJs(`location.hash = ${JSON.stringify(shot.hash)}`)
    await sleep(2200)
    const ok = await evalJs(
      `${JSON.stringify(shot.wait)}.every((s) => document.querySelector(s))`,
    )
    if (!ok) throw new Error(`${shot.name}: 页面标记 ${shot.wait.join(' / ')} 未出现，拒绝截图`)
    const { data } = await S('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`${OUT}/${shot.name}.png`, Buffer.from(data, 'base64'))
    console.log('shot', shot.name, '-', shot.label)
  }

  await browser.send('Target.closeTarget', { targetId })
  chrome.kill()
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
