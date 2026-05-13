import { useState } from 'react'
import { useAppStore } from '../../store'
import type { ServerConfig } from '../../types/app'

export default function SetupView() {
  const { servers, setServers, setActiveServer, setView } = useAppStore()

  const [displayName, setDisplayName] = useState('')
  const [url, setUrl] = useState('http://')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  function validateUrl(value: string): boolean {
    try {
      const u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function handleSave() {
    const trimmedUrl = url.replace(/\/$/, '')
    if (!validateUrl(trimmedUrl)) {
      setError('올바른 URL을 입력하세요 (예: http://192.168.1.100:8080/guacamole)')
      return
    }

    setSaving(true)
    setError('')

    const newServer: ServerConfig = {
      url: trimmedUrl,
      displayName: displayName.trim() || trimmedUrl,
    }

    let updated: ServerConfig[]
    if (editingIndex !== null) {
      updated = servers.map((s, i) => (i === editingIndex ? newServer : s))
    } else {
      updated = [...servers, newServer]
    }

    await window.electronAPI.store.set('servers', updated)
    await window.electronAPI.store.set('lastServer', newServer)

    setServers(updated)
    setActiveServer(newServer)
    setView('login')
    setSaving(false)
  }

  function handleEdit(index: number) {
    const s = servers[index]
    setDisplayName(s.displayName)
    setUrl(s.url)
    setEditingIndex(index)
    setError('')
  }

  async function handleDelete(index: number) {
    const updated = servers.filter((_, i) => i !== index)
    await window.electronAPI.store.set('servers', updated)
    setServers(updated)
    if (editingIndex === index) {
      setEditingIndex(null)
      setDisplayName('')
      setUrl('http://')
    }
  }

  function handleSelectServer(server: ServerConfig) {
    setActiveServer(server)
    window.electronAPI.store.set('lastServer', server)
    setView('login')
  }

  return (
    <div className="h-full flex items-center justify-center bg-surface animate-fade-in p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="16" rx="2" stroke="#3d8ef0" strokeWidth="1.5"/>
              <path d="M9 24h10M14 18v6" stroke="#3d8ef0" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 8h12M8 12h8" stroke="#3d8ef0" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">GuacDesktop</h1>
          <p className="text-sm text-text-secondary mt-1">
            과콰몰리 서버를 추가하여 시작하세요
          </p>
        </div>

        {/* 저장된 서버 목록 */}
        {servers.length > 0 && (
          <div className="card space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              저장된 서버
            </p>
            {servers.map((server, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-overlay group"
              >
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="1" width="11" height="7" rx="1" stroke="#3d8ef0" strokeWidth="1"/>
                    <path d="M4.5 11.5h4M6.5 8v3.5" stroke="#3d8ef0" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => handleSelectServer(server)}
                >
                  <p className="text-sm font-medium text-text-primary truncate">
                    {server.displayName}
                  </p>
                  <p className="text-xs text-text-muted truncate">{server.url}</p>
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(i)}
                    className="p-1.5 rounded hover:bg-border text-text-muted hover:text-text-primary"
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 9L8.5 1.5 9.5 2.5 2 10H1V9z" stroke="currentColor" strokeWidth="1" fill="none"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="p-1.5 rounded hover:bg-error/20 text-text-muted hover:text-error"
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1.5 1.5L9.5 9.5M9.5 1.5L1.5 9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 서버 추가/수정 폼 */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {editingIndex !== null ? '서버 수정' : '새 서버 추가'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">
                표시 이름 <span className="text-text-muted">(선택)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="예: 메인 서버"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1.5">
                서버 URL <span className="text-error">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                placeholder="http://192.168.1.100:8080/guacamole"
                className="input-field font-mono text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <p className="text-[10px] text-text-muted mt-1">
                과콰몰리 웹 앱 URL (경로 포함)
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            {editingIndex !== null && (
              <button
                onClick={() => { setEditingIndex(null); setDisplayName(''); setUrl('http://'); setError('') }}
                className="btn-secondary flex-1"
              >
                취소
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !url}
              className="btn-primary flex-1"
            >
              {saving ? '저장 중...' : editingIndex !== null ? '수정' : '추가 및 연결'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
