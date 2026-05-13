import { useEffect } from 'react'
import { useAppStore } from './store'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import SetupView from './components/views/SetupView'
import LoginView from './components/views/LoginView'
import ConnectionsView from './components/views/ConnectionsView'
import GuacViewer from './components/views/GuacViewer'
import type { ServerConfig } from './types/app'

export default function App() {
  const { view, setView, setServers, setActiveServer, sidebarCollapsed } = useAppStore()

  // 앱 시작 시 저장된 설정 로드
  useEffect(() => {
    async function loadSettings() {
      try {
        const all = await window.electronAPI.store.getAll()
        const savedServers = (all.servers as ServerConfig[]) ?? []
        const lastServer = all.lastServer as ServerConfig | undefined

        setServers(savedServers)

        if (lastServer && savedServers.find((s) => s.url === lastServer.url)) {
          setActiveServer(lastServer)
          setView('login')
        } else if (savedServers.length > 0) {
          setActiveServer(savedServers[0])
          setView('login')
        } else {
          setView('setup')
        }
      } catch {
        setView('setup')
      }
    }
    loadSettings()
  }, [setView, setServers, setActiveServer])

  const showSidebar = view === 'connections' || view === 'session'

  return (
    <div className="flex flex-col h-full bg-surface">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 */}
        {showSidebar && (
          <Sidebar collapsed={sidebarCollapsed} />
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-hidden relative">
          {view === 'setup' && <SetupView />}
          {view === 'login' && <LoginView />}
          {view === 'connections' && <ConnectionsView />}
          {view === 'session' && <GuacViewer />}
        </main>
      </div>
    </div>
  )
}
