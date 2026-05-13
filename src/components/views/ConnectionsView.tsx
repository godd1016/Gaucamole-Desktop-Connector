import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import { getConnections } from '../../lib/api'
import type { GuacConnection } from '../../types/app'

const PROTOCOL_COLORS: Record<string, string> = {
  rdp: '#3d8ef0',
  vnc: '#9b59b6',
  ssh: '#3dba64',
  telnet: '#f0a030',
  kubernetes: '#326ce5',
}

const PROTOCOL_DESC: Record<string, string> = {
  rdp: 'Windows Remote Desktop',
  vnc: 'Virtual Network Computing',
  ssh: 'Secure Shell',
  telnet: 'Telnet',
  kubernetes: 'Kubernetes',
}

function ConnectionCard({ conn, onOpen }: { conn: GuacConnection; onOpen: () => void }) {
  const protocol = conn.protocol?.toLowerCase() ?? 'rdp'
  const color = PROTOCOL_COLORS[protocol] ?? '#666'
  const desc = PROTOCOL_DESC[protocol] ?? protocol.toUpperCase()

  return (
    <button
      onClick={onOpen}
      className="card text-left hover:border-accent/40 hover:bg-surface-overlay transition-all duration-150
                 group flex flex-col gap-3 animate-slide-up"
    >
      {/* 프로토콜 아이콘 영역 */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '22' }}
        >
          <ProtocolIcon protocol={protocol} color={color} />
        </div>
        {conn.activeConnections > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            활성
          </span>
        )}
      </div>

      {/* 연결 정보 */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
          {conn.name}
        </h3>
        <p className="text-xs text-text-muted">{desc}</p>
      </div>

      {/* 하단 배지 */}
      <div className="flex items-center justify-between mt-auto">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: color + '22', color }}
        >
          {protocol.toUpperCase()}
        </span>
        <svg
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 7h8M8 4l3 3-3 3" stroke="#3d8ef0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  )
}

function ProtocolIcon({ protocol, color }: { protocol: string; color: string }) {
  switch (protocol) {
    case 'rdp':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="2" width="16" height="11" rx="1.5" stroke={color} strokeWidth="1.2"/>
          <path d="M5 16h8M9 13v3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M6 6.5h6M6 9h4" stroke={color} strokeWidth="1" strokeLinecap="round"/>
        </svg>
      )
    case 'vnc':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="2" width="16" height="11" rx="1.5" stroke={color} strokeWidth="1.2"/>
          <path d="M5 16h8M9 13v3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="9" cy="7.5" r="2.5" stroke={color} strokeWidth="1"/>
        </svg>
      )
    case 'ssh':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="2" width="16" height="14" rx="1.5" stroke={color} strokeWidth="1.2"/>
          <path d="M4 12l3-3-3-3M9 12h5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="2" width="16" height="11" rx="1.5" stroke={color} strokeWidth="1.2"/>
          <path d="M5 16h8M9 13v3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )
  }
}

export default function ConnectionsView() {
  const {
    activeServer, session, connections, loadingConnections,
    setConnections, setLoadingConnections, setActiveConnection, setView,
  } = useAppStore()

  const [search, setSearch] = useState('')
  const [filterProtocol, setFilterProtocol] = useState<string>('all')

  const loadConnections = useCallback(async () => {
    if (!activeServer || !session) return
    setLoadingConnections(true)
    try {
      const list = await getConnections(activeServer, session)
      setConnections(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingConnections(false)
    }
  }, [activeServer, session, setConnections, setLoadingConnections])

  useEffect(() => {
    if (connections.length === 0) loadConnections()
  }, [connections.length, loadConnections])

  const protocols = Array.from(new Set(connections.map((c) => c.protocol?.toLowerCase()).filter(Boolean)))

  const filtered = connections.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchProto = filterProtocol === 'all' || c.protocol?.toLowerCase() === filterProtocol
    return matchSearch && matchProto
  })

  function openConnection(conn: GuacConnection) {
    setActiveConnection(conn)
    setView('session')
  }

  return (
    <div className="h-full flex flex-col bg-surface animate-fade-in">
      {/* 상단 툴바 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
        <h1 className="text-base font-semibold text-text-primary">연결</h1>

        <div className="flex-1 relative max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="연결 검색..."
            className="input-field pl-8 py-1.5 text-xs"
          />
        </div>

        {protocols.length > 1 && (
          <div className="flex gap-1">
            {['all', ...protocols].map((p) => (
              <button
                key={p}
                onClick={() => setFilterProtocol(p)}
                className={`
                  text-xs px-2.5 py-1 rounded-lg transition-colors
                  ${filterProtocol === p
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:bg-surface-overlay'
                  }
                `}
              >
                {p === 'all' ? '전체' : p.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={loadConnections}
          disabled={loadingConnections}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <svg
            className={loadingConnections ? 'animate-spin' : ''}
            width="14" height="14" viewBox="0 0 14 14" fill="none"
          >
            <path d="M12 7A5 5 0 112 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M12 7V4M12 7H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* 연결 그리드 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loadingConnections ? (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
              <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            연결 목록 로드 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-3 opacity-40">
              <rect x="2" y="2" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 28h12M16 22v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm">
              {search ? '검색 결과가 없습니다' : '연결이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((conn) => (
              <ConnectionCard
                key={conn.identifier}
                conn={conn}
                onOpen={() => openConnection(conn)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
