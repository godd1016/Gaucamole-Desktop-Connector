import { useAppStore } from '../store'
import { logout as apiLogout } from '../lib/api'
import type { GuacConnection } from '../types/app'

interface Props {
  collapsed: boolean
}

const PROTOCOL_COLORS: Record<string, string> = {
  rdp: '#3d8ef0',
  vnc: '#9b59b6',
  ssh: '#3dba64',
  telnet: '#f0a030',
  kubernetes: '#326ce5',
}

const PROTOCOL_LABEL: Record<string, string> = {
  rdp: 'RDP',
  vnc: 'VNC',
  ssh: 'SSH',
  telnet: 'TELNET',
  kubernetes: 'K8S',
}

function ProtocolBadge({ protocol }: { protocol: string }) {
  const color = PROTOCOL_COLORS[protocol.toLowerCase()] ?? '#666'
  const label = PROTOCOL_LABEL[protocol.toLowerCase()] ?? protocol.toUpperCase()
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: color + '22', color }}
    >
      {label}
    </span>
  )
}

function ConnectionItem({ conn }: { conn: GuacConnection }) {
  const { activeConnection, setActiveConnection, setView } = useAppStore()
  const isActive = activeConnection?.identifier === conn.identifier

  function openConnection() {
    setActiveConnection(conn)
    setView('session')
  }

  return (
    <button
      onClick={openConnection}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
        transition-colors duration-100 group
        ${isActive
          ? 'bg-accent/20 text-accent'
          : 'hover:bg-surface-overlay text-text-secondary hover:text-text-primary'
        }
      `}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: isActive
            ? PROTOCOL_COLORS[conn.protocol?.toLowerCase()] ?? '#3d8ef0'
            : '#555',
        }}
      />
      <span className="flex-1 text-sm truncate">{conn.name}</span>
      <ProtocolBadge protocol={conn.protocol ?? 'rdp'} />
    </button>
  )
}

export default function Sidebar({ collapsed }: Props) {
  const { activeServer, session, connections, setView, logout } = useAppStore()

  async function handleLogout() {
    if (activeServer && session) {
      await apiLogout(activeServer, session)
    }
    logout()
  }

  if (collapsed) return null

  return (
    <aside className="w-56 flex-shrink-0 bg-surface-raised border-r border-border flex flex-col animate-fade-in">
      {/* 서버 정보 */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="6" rx="1" stroke="#3d8ef0" strokeWidth="1"/>
              <path d="M4 10h4M6 7v3" stroke="#3d8ef0" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">
              {activeServer?.displayName || '서버'}
            </p>
            <p className="text-[10px] text-text-muted truncate">
              {session?.username ?? ''}
            </p>
          </div>
        </div>
      </div>

      {/* 연결 목록 */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-1.5">
          연결 ({connections.length})
        </p>

        {connections.length === 0 ? (
          <p className="text-xs text-text-muted px-2 py-2">연결이 없습니다</p>
        ) : (
          <div className="space-y-0.5">
            {connections.map((conn) => (
              <ConnectionItem key={conn.identifier} conn={conn} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 버튼들 */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => setView('connections')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/>
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/>
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/>
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/>
          </svg>
          모든 연결
        </button>

        <button
          onClick={() => setView('setup')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.5 2.5l1 1M9.5 9.5l1 1M2.5 10.5l1-1M9.5 3.5l1-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1"/>
          </svg>
          서버 설정
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-error/70 hover:bg-error/10 hover:text-error transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 11H2.5A1.5 1.5 0 011 9.5v-6A1.5 1.5 0 012.5 2H5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <path d="M9 9l3-2.5L9 4M12 6.5H5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          로그아웃
        </button>
      </div>
    </aside>
  )
}
