import { useState } from 'react'
import { useAppStore } from '../../store'
import { login, getConnections } from '../../lib/api'

export default function LoginView() {
  const { activeServer, setSession, setConnections, setView } = useAppStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin() {
    if (!activeServer) return
    if (!username.trim()) { setError('사용자 이름을 입력하세요'); return }

    setLoading(true)
    setError('')

    try {
      const session = await login(activeServer, username, password)
      setSession(session)

      // 연결 목록 미리 로드
      const connections = await getConnections(activeServer, session)
      setConnections(connections)
      setView('connections')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-surface animate-fade-in p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="8" r="4" stroke="#3d8ef0" strokeWidth="1.5"/>
              <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#3d8ef0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-text-primary">로그인</h2>
          {activeServer && (
            <button
              onClick={() => setView('setup')}
              className="mt-1 text-xs text-accent hover:text-accent-hover transition-colors"
              title="서버 변경"
            >
              {activeServer.displayName || activeServer.url}
            </button>
          )}
        </div>

        {/* 폼 */}
        <div className="card space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">
              사용자 이름
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              placeholder="guacadmin"
              className="input-field"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                className="input-field pr-10"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M5.5 5.7A2 2 0 009.3 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M2.5 3.5C1.5 4.5 1 6 1 7c0 0 2 5 6 5 1.4 0 2.6-.5 3.5-1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M5 2.5C5.6 2.2 6.3 2 7 2c4 0 6 5 6 5s-.4 1.2-1.2 2.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim()}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                연결 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>
        </div>

        <button
          onClick={() => setView('setup')}
          className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors text-center"
        >
          다른 서버에 연결
        </button>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
      <path d="M7 2a5 5 0 015 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
