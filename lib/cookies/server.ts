import { cookies } from 'next/headers'
import {
  UI_PREFS_COOKIE,
  AUTH_FLOW_COOKIE,
  UX_FLAGS_COOKIE,
} from './constants'
import {
  parseUiPrefsCookie,
  parseAuthFlowCookie,
  parseUxFlagsCookie,
} from './serializer'
import type { UiPrefsPayload, AuthFlowPayload, UxFlagsPayload } from './types'

export async function readUiPrefsCookie(): Promise<UiPrefsPayload | null> {
  const store = await cookies()
  const raw = store.get(UI_PREFS_COOKIE)?.value
  return parseUiPrefsCookie(raw)
}

export async function readAuthFlowCookie(): Promise<AuthFlowPayload | null> {
  const store = await cookies()
  const raw = store.get(AUTH_FLOW_COOKIE)?.value
  return parseAuthFlowCookie(raw)
}

export async function readUxFlagsCookie(): Promise<UxFlagsPayload | null> {
  const store = await cookies()
  const raw = store.get(UX_FLAGS_COOKIE)?.value
  return parseUxFlagsCookie(raw)
}
