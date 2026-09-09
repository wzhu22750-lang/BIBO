// Dev-only page screenshot harness (CDP, no extra deps).
// Usage: node scripts/qa/shoot.mjs [baseURL]
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5173'
const OUT = 'scripts/qa/out/pages'
mkdirSync(OUT, { recursive: true })

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url) {
  const res = await fetch(url)
  return res.json()
}

function cdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl)
  const pending = new Map()
  const events = []
  let id = 0
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    } else {
      events.push(msg)
    }
  }
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  return {
    ws,
    send,
    events,
    ready: new Promise((r) => (ws.onopen = r)),
  }
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--user-data-dir=/tmp/qa-chrome-profile',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=430,930',
    'about:blank',
  ])
  chrome.stderr.on('data', () => {})
  await sleep(1500)

  const version = await getJSON('http://127.0.0.1:9333/json/version')
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

  const evalJs = async (expression) => {
    const r = await S('Runtime.evaluate', { expression, returnByValue: true })
    return r.result?.value
  }

  await S('Page.navigate', { url: BASE + '/#home' })
  await sleep(2500)

  // enter demo mode if the auth screen is present
  for (let i = 0; i < 20; i++) {
    const clicked = await evalJs(
      `(() => { const b=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('进入本地演示')); if(b){b.click(); return 'clicked'} return 'notfound' })()`,
    )
    if (clicked === 'clicked') break
    await sleep(500)
  }
  await sleep(2500)

  const shots = [
    ['home', '#home'],
    ['wardrobe', '#wardrobe'],
    ['wardrobe_qa', '#wardrobe?mode=qa'],
    ['focus', '#focus'],
    ['chat', '#chat'],
    ['settings', '#settings'],
  ]

  for (const [name, hash] of shots) {
    await evalJs(`location.hash = ${JSON.stringify(hash.slice(1))}`)
    await sleep(2200)
    const { data } = await S('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
    console.log('shot', name)
  }

  await browser.send('Target.closeTarget', { targetId })
  chrome.kill()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
