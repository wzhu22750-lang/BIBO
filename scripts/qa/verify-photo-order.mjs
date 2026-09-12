// Dev-only harness: verifies the photo wall time-order toggle (desc / asc).
// Usage: node scripts/qa/verify-photo-order.mjs [baseURL]   (needs `npm run dev`)
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const W = Number(process.argv[3] || 406)
const H = Number(process.argv[4] || 721)
const OUT = 'scripts/qa/out/verify'
mkdirSync(OUT, { recursive: true })
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url) {
  return (await fetch(url)).json()
}
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
    '--remote-debugging-port=9444',
    '--user-data-dir=/tmp/qa-chrome-photos',
    '--no-first-run',
    '--window-size=430,930',
    'about:blank',
  ])
  chrome.stderr.on('data', () => {})
  await sleep(1500)
  const version = await getJSON('http://127.0.0.1:9444/json/version')
  const browser = cdpClient(version.webSocketDebuggerUrl)
  await browser.ready
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true })
  const S = (m, p) => browser.send(m, p, sessionId)
  await S('Page.enable')
  await S('Runtime.enable')
  await S('Emulation.setDeviceMetricsOverride', {
    width: W,
    height: H,
    deviceScaleFactor: 2,
    mobile: true,
  })
  const evalJs = async (expression) =>
    (await S('Runtime.evaluate', { expression, returnByValue: true })).result?.value
  const shot = async (name) => {
    const { data } = await S('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  }
  const captions = () =>
    evalJs(
      `[...document.querySelectorAll('.photos-grid .photo-caption strong')].map(n=>n.textContent)`,
    )
  const clickOrder = (label) =>
    evalJs(
      `(() => { const b=[...document.querySelectorAll('.memory-order-toggle button')].find(b=>b.textContent.includes(${JSON.stringify(label)})); if(!b) return 'missing'; b.click(); return 'clicked' })()`,
    )

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

  // Home daily memories: exactly three cards, drawn from the space photos.
  const homeCount = await evalJs(
    `document.querySelectorAll('.memories-panel .photo-card').length`,
  )
  console.log('home daily memories:', homeCount)
  if (homeCount !== 3) throw new Error(`expected 3 daily memories, got ${homeCount}`)

  await evalJs(`location.hash = 'photos'`)
  await sleep(2000)
  const desc = await captions()
  if (await clickOrder('最早在前') !== 'clicked') throw new Error('order toggle missing')
  await sleep(800)
  const asc = await captions()
  await shot('photos_asc')
  if (await clickOrder('最新在前') !== 'clicked') throw new Error('order toggle missing')
  await sleep(800)
  const descAgain = await captions()
  await shot('photos_desc')
  const overflow = await evalJs(
    `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
  )
  console.log('desc     :', desc)
  console.log('asc      :', asc)
  console.log('back desc:', descAgain)
  console.log('viewport:', `${W}x${H}`)
  console.log('h-overflow px:', overflow)
  console.log(
    'toggle rect:',
    await evalJs(
      `JSON.stringify([...document.querySelectorAll('.memory-order-toggle button')].map(b=>({t:b.textContent.trim(),bg:getComputedStyle(b).backgroundColor,rect:(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(b.getBoundingClientRect())})))`,
    ),
  )
  console.log(
    'arrows:',
    await evalJs(
      `JSON.stringify([...document.querySelectorAll('.memory-order-toggle .toggle-arrow')].map(a=>({c:a.getAttribute('class'),t:getComputedStyle(a).transform})))`,
    ),
  )
  console.log(
    'label row:',
    await evalJs(
      `JSON.stringify((r=>({y:Math.round(r.y),h:Math.round(r.height),w:Math.round(r.width)}))(document.querySelector('.collection-label').getBoundingClientRect())) + ' | ' + JSON.stringify((r=>({y:Math.round(r.y),h:Math.round(r.height)}))(document.querySelector('.collection-label > span').getBoundingClientRect()))`,
    ),
  )
  if (asc.length < 2) throw new Error('not enough photos to compare order')
  if (JSON.stringify(asc) !== JSON.stringify([...desc].reverse()))
    throw new Error('asc order is not the reverse of desc order')
  if (JSON.stringify(descAgain) !== JSON.stringify(desc))
    throw new Error('toggling back did not restore the desc order')
  if (overflow > 0) throw new Error('photo wall causes horizontal overflow')
  console.log('OK: photo wall order toggle verified')
  await browser.send('Target.closeTarget', { targetId })
  chrome.kill()
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
