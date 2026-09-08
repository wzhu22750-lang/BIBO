// Bounded coalescing: events cannot keep postponing the first read, nor overlap reads.
export function createReloadScheduler(
  reload: () => Promise<void>,
  onError: (error: unknown) => void,
  delay = 180,
) {
  let disposed = false,
    running = false,
    dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    if (disposed) return
    dirty = true
    if (running || timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      void execute()
    }, delay)
  }
  const execute = async () => {
    if (disposed || running) return
    dirty = false
    running = true
    try {
      await reload()
    } catch (error) {
      if (!disposed) onError(error)
    } finally {
      running = false
      if (dirty && !disposed) schedule()
    }
  }
  return {
    schedule,
    dispose() {
      disposed = true
      dirty = false
      clearTimeout(timer)
      timer = undefined
    },
  }
}
