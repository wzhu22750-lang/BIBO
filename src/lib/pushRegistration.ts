const PUSH_TOKEN_KEY = 'bibo-current-push-token-v1'

export function readStoredPushToken(): string | undefined {
  try {
    const value = localStorage.getItem(PUSH_TOKEN_KEY)
    return value && value.length >= 20 && value.length <= 4096 ? value : undefined
  } catch {
    return undefined
  }
}

export function storePushToken(token: string) {
  if (token.length < 20 || token.length > 4096) return
  try {
    localStorage.setItem(PUSH_TOKEN_KEY, token)
  } catch {}
}

export function clearStoredPushToken() {
  try {
    localStorage.removeItem(PUSH_TOKEN_KEY)
  } catch {}
}

import { BibuNative, type PushRegistration } from '../native'
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
  native = BibuNative,
  backend: PushBackend = api,
  requestPermission = true,
): Promise<PushRegistration & { stored?: boolean }> {
  const result = await native.push.register({ requestPermission })
  if (!result.supported || !result.token) return result
  await backend.registerDeviceInstallation(userId, result.token, appVersion)
  storePushToken(result.token)
  return { ...result, stored: true }
}
export async function unregisterDevicePush(
  userId: string,
  token: string | undefined,
  native = BibuNative,
  backend: PushBackend = api,
) {
  const currentToken = token || readStoredPushToken()
  const result = await native.push.unregister()
  if (result.supported && currentToken) await backend.removeDeviceInstallation(userId, currentToken)
  if (result.supported) clearStoredPushToken()
  return result
}
