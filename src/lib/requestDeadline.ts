export class RequestDeadlineError extends Error {
  constructor(message = '网络请求超时，结果尚未确认；原消息已保留，稍后使用同一 ID 重试') {
    super(message)
    this.name = 'RequestDeadlineError'
  }
}
// An uncooperative promise must not hold the queue lock forever. Abort the transport as well.
export async function withRequestDeadline<T>(
  run: (signal: AbortSignal) => PromiseLike<T>,
  milliseconds = 20000,
  message?: string,
): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestDeadlineError(message))
      controller.abort()
    }, milliseconds)
  })
  try {
    return await Promise.race([Promise.resolve().then(() => run(controller.signal)), deadline])
  } finally {
    clearTimeout(timer)
  }
}
