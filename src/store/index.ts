import { create } from 'zustand'
import type { AppView, GuacConnection, GuacSession, ServerConfig } from '../types/app'

interface AppState {
  // 현재 뷰
  view: AppView

  // 서버 설정
  servers: ServerConfig[]
  activeServer: ServerConfig | null

  // 세션 정보
  session: GuacSession | null

  // 연결 목록
  connections: GuacConnection[]
  loadingConnections: boolean

  // 활성 원격 세션
  activeConnection: GuacConnection | null

  // 사이드바 접기
  sidebarCollapsed: boolean

  // 액션
  setView: (view: AppView) => void
  setServers: (servers: ServerConfig[]) => void
  setActiveServer: (server: ServerConfig | null) => void
  setSession: (session: GuacSession | null) => void
  setConnections: (connections: GuacConnection[]) => void
  setLoadingConnections: (loading: boolean) => void
  setActiveConnection: (connection: GuacConnection | null) => void
  toggleSidebar: () => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'setup',
  servers: [],
  activeServer: null,
  session: null,
  connections: [],
  loadingConnections: false,
  activeConnection: null,
  sidebarCollapsed: false,

  setView: (view) => set({ view }),
  setServers: (servers) => set({ servers }),
  setActiveServer: (server) => set({ activeServer: server }),
  setSession: (session) => set({ session }),
  setConnections: (connections) => set({ connections }),
  setLoadingConnections: (loading) => set({ loadingConnections: loading }),
  setActiveConnection: (connection) => set({ activeConnection: connection }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  logout: () =>
    set({
      session: null,
      connections: [],
      activeConnection: null,
      view: 'login',
    }),
}))
