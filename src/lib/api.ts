import type { GuacConnection, GuacSession, ServerConfig } from '../types/app'

const api = window.electronAPI.http

// ─── 인증 ──────────────────────────────────────────────────────────────────────
export async function login(
  server: ServerConfig,
  username: string,
  password: string
): Promise<GuacSession> {
  const body = new URLSearchParams({ username, password }).toString()
  const res = await api.request({
    url: `${server.url}/api/tokens`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  })

  if (res.status !== 200) {
    let msg = '로그인에 실패했습니다.'
    try {
      const err = JSON.parse(res.data)
      if (err.message) msg = err.message
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  const data = JSON.parse(res.data)
  return {
    authToken: data.authToken,
    dataSource: data.dataSource,
    username: data.username,
    availableDataSources: data.availableDataSources ?? [data.dataSource],
  }
}

export async function logout(server: ServerConfig, session: GuacSession): Promise<void> {
  try {
    await api.request({
      url: `${server.url}/api/tokens/${session.authToken}`,
      method: 'DELETE',
    })
  } catch {
    // ignore logout errors
  }
}

// ─── 연결 목록 ─────────────────────────────────────────────────────────────────
export async function getConnections(
  server: ServerConfig,
  session: GuacSession
): Promise<GuacConnection[]> {
  const res = await api.request({
    url: `${server.url}/api/session/data/${session.dataSource}/connections?token=${session.authToken}`,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })

  if (res.status !== 200) {
    throw new Error('연결 목록을 불러오는 데 실패했습니다.')
  }

  const data: Record<string, Omit<GuacConnection, 'identifier'>> = JSON.parse(res.data)
  return Object.entries(data).map(([id, conn]) => ({
    identifier: id,
    ...conn,
  }))
}

// ─── WebSocket 터널 URL 생성 ────────────────────────────────────────────────────
export function buildTunnelUrl(serverUrl: string): string {
  return serverUrl.replace(/^http/, 'ws') + '/websocket-tunnel'
}

export function buildHttpTunnelUrl(serverUrl: string): string {
  return serverUrl + '/tunnel'
}

// ─── 연결 파라미터 ─────────────────────────────────────────────────────────────
export function buildConnectParams(
  session: GuacSession,
  connectionId: string,
  width: number,
  height: number
): string {
  return new URLSearchParams({
    token: session.authToken,
    GUAC_DATA_SOURCE: session.dataSource,
    GUAC_ID: connectionId,
    GUAC_TYPE: 'c',
    GUAC_WIDTH: String(Math.floor(width)),
    GUAC_HEIGHT: String(Math.floor(height)),
    GUAC_DPI: '96',
    GUAC_TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone,
    GUAC_AUDIO: 'audio/L8',
    GUAC_IMAGE: 'image/png,image/jpeg,image/webp',
  }).toString()
}
