export type LocalReminder = { id: number }
export type AccountCleanupDeps = {
  clearSpaceCache: () => void
  clearOutbox: () => Promise<void>
  removeSavedEmail: () => void
  clearChatDrafts?: () => void
  unregisterPush?: () => Promise<void>
  listReminders: () => Promise<{ supported: boolean; items: LocalReminder[] }>
  cancelReminder: (id: number) => Promise<unknown>
}
export async function cleanupAccountLocal(deps: AccountCleanupDeps): Promise<string[]> {
  const errors: string[] = []
  try {
    deps.clearSpaceCache()
  } catch (error) {
    errors.push(`离线快照：${String(error)}`)
  }
  try {
    await deps.clearOutbox()
  } catch (error) {
    errors.push(`待发送消息：${String(error)}`)
  }
  try {
    deps.removeSavedEmail()
  } catch (error) {
    errors.push(`保存的邮箱：${String(error)}`)
  }
  if (deps.clearChatDrafts) {
    try {
      deps.clearChatDrafts()
    } catch (error) {
      errors.push(`聊天草稿：${String(error)}`)
    }
  }
  if (deps.unregisterPush) {
    try {
      await deps.unregisterPush()
    } catch (error) {
      errors.push(`远程 Push：${String(error)}`)
    }
  }
  try {
    const result = await deps.listReminders()
    if (result.supported) {
      for (const reminder of result.items) {
        try {
          await deps.cancelReminder(reminder.id)
        } catch (error) {
          errors.push(`本机提醒 ${reminder.id}：${String(error)}`)
        }
      }
    }
  } catch (error) {
    errors.push(`本机提醒列表：${String(error)}`)
  }
  return errors
}

export type SessionPrivacyCleanupDeps = {
  removeDeviceInstallations: () => Promise<void>
  unregisterPush?: () => Promise<void>
  listReminders: () => Promise<{ supported: boolean; items: LocalReminder[] }>
  cancelReminder: (id: number) => Promise<unknown>
}

export async function cleanupSessionPrivacy(deps: SessionPrivacyCleanupDeps): Promise<string[]> {
  const errors: string[] = []
  try {
    await deps.removeDeviceInstallations()
  } catch (error) {
    // Keep the session if the server still associates this account with a Push token.
    errors.push(`远程 Push 登记：${String(error)}`)
  }
  if (deps.unregisterPush) {
    try {
      await deps.unregisterPush()
    } catch (error) {
      errors.push(`本机 Push：${String(error)}`)
    }
  }
  try {
    const result = await deps.listReminders()
    if (result.supported) {
      for (const reminder of result.items) {
        try {
          await deps.cancelReminder(reminder.id)
        } catch (error) {
          errors.push(`本机提醒 ${reminder.id}：${String(error)}`)
        }
      }
    }
  } catch (error) {
    errors.push(`本机提醒列表：${String(error)}`)
  }
  return errors
}
