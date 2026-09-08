import { BiboNative, type PushRegistration } from '../native'
import * as api from './api'
export type PushBackend = {
  registerDeviceInstallation: (
    userId: string,
    token: string,
    appVersion?: string,
  ) => Promise<unknown>
  removeDeviceInstallation: (userId: string, token: string) => Promise<unknown>
}
export async function registerDevicePush(
  userId: string,
  appVersion = 'unknown',
  native = BiboNative,
  backend: PushBackend = api,
): Promise<PushRegistration & { stored?: boolean }> {
  const result = await native.push.register()
  if (!result.supported || !result.token) return result
  await backend.registerDeviceInstallation(userId, result.token, appVersion)
  return { ...result, stored: true }
}
export async function unregisterDevicePush(
  userId: string,
  token: string | undefined,
  native = BiboNative,
  backend: PushBackend = api,
) {
  const result = await native.push.unregister()
  if (result.supported && token) await backend.removeDeviceInstallation(userId, token)
  return result
}
