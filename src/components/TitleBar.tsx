import { useAppStore } from '../store'

export default function TitleBar() {
  const { view, activeServer, session, toggleSidebar, sidebarCollapsed } = useAppStore()

  const handleMinimize = () => window.electronAPI.window.minimize()
  const handleMaximize = () => window.electronAPI.window.maximize()
  const handleClose = () => window.electronAPI.window.close()

  const showSidebarToggle = view === 'connections' || view === 'session'

  return (
    <header
      className="titlebar-drag flex items-center h-10 bg-surface border-b border-border/50 select-none flex-shrink-0"
      style={{ minHeight: 40 }}
    >
      {/* 왼쪽: 앱 아이콘 + 타이틀 */}
      <div className="titlebar-no-drag flex items-center gap-2 px-3">
        {showSidebarToggle && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-surface-overlay transition-colors text-text-secondary hover:text-text-primary"
            title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
        )}
      </div>

      {/* 가운데: 타이틀 */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs font-medium text-text-secondary tracking-wide">
          {view === 'session' && activeServer
            ? activeServer.displayName || activeServer.url
            : 'GuacDesktop'}
        </span>
        {session && view === 'connections' && (
          <span className="ml-2 text-xs text-text-muted">
            · {session.username}
          </span>
        )}
      </div>

      {/* 오른쪽: 윈도우 컨트롤 */}
      <div className="titlebar-no-drag flex items-center">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
            <rect width="10" height="1" fill="currentColor"/>
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-error hover:text-white transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
