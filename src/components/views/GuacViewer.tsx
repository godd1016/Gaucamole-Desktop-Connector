import { useCallback, useEffect, useRef, useState } from 'react'
import Guacamole from 'guacamole-common-js'
import { useAppStore } from '../../store'
import { buildConnectParams, buildHttpTunnelUrl, buildTunnelUrl } from '../../lib/api'

type SessionState = 'connecting' | 'connected' | 'disconnected' | 'error'

const CLIENT_STATE_LABELS: Record<number, string> = {
  0: '유휴',
  1: '연결 중...',
  2: '대기 중...',
  3: '연결됨',
  4: '연결 해제 중...',
  5: '연결 해제됨',
}

export default function GuacViewer() {
  const { activeServer, session, activeConnection, setView, setActiveConnection } = useAppStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<Guacamole.Client | null>(null)
  const keyboardRef = useRef<Guacamole.Keyboard | null>(null)
  const mouseRef = useRef<Guacamole.Mouse | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const [sessionState, setSessionState] = useState<SessionState>('connecting')
  const [errorMessage, setErrorMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const toolbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const imeTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const disconnect = useCallback(() => {
    keyboardRef.current?.reset()
    resizeObserverRef.current?.disconnect()
    mouseRef.current = null
    keyboardRef.current = null
    resizeObserverRef.current = null

    if (imeTextareaRef.current) {
      imeTextareaRef.current.remove()
      imeTextareaRef.current = null
    }

    if (clientRef.current) {
      try { clientRef.current.disconnect() } catch { /* ignore */ }
      clientRef.current = null
    }
  }, [])

  // 툴바 자동 숨김
  function resetToolbarTimer() {
    setShowToolbar(true)
    if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current)
    toolbarTimerRef.current = setTimeout(() => {
      if (sessionState === 'connected') setShowToolbar(false)
    }, 3000)
  }

  useEffect(() => {
    if (!activeServer || !session || !activeConnection || !containerRef.current) return

    const container = containerRef.current
    const wsUrl = buildTunnelUrl(activeServer.url)
    const httpUrl = buildHttpTunnelUrl(activeServer.url)

    // 터널 생성 (WebSocket 우선, HTTP 폴백)
    const tunnel = new Guacamole.ChainedTunnel(
      new Guacamole.WebSocketTunnel(wsUrl),
      new Guacamole.HTTPTunnel(httpUrl, true)
    )

    const client = new Guacamole.Client(tunnel)
    clientRef.current = client

    // 디스플레이 마운트
    const display = client.getDisplay()
    const displayEl = display.getElement()
    displayEl.style.position = 'absolute'
    displayEl.style.top = '0'
    displayEl.style.left = '0'
    container.innerHTML = ''
    container.appendChild(displayEl)

    // 상태 변경 핸들러
    client.onstatechange = (state: number) => {
      console.log('[Guac] Client state:', state, CLIENT_STATE_LABELS[state])
      if (state === Guacamole.Client.State.CONNECTED) {
        setSessionState('connected')
      } else if (state === Guacamole.Client.State.DISCONNECTED) {
        setSessionState('disconnected')
      }
    }

    client.onerror = (status: Guacamole.Status) => {
      console.error('[Guac] Error:', status)
      setSessionState('error')
      setErrorMessage(status.message || `오류 코드: ${status.code}`)
    }

    // 화면 크기 조정
    function syncSize() {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w > 0 && h > 0) {
        display.scale(1)
        client.sendSize(w, h)

        // 디스플레이 스케일 조정
        const dw = display.getWidth()
        const dh = display.getHeight()
        if (dw > 0 && dh > 0) {
          const scaleX = w / dw
          const scaleY = h / dh
          display.scale(Math.min(scaleX, scaleY))
        }
      }
    }

    display.onresize = () => syncSize()

    resizeObserverRef.current = new ResizeObserver(() => syncSize())
    resizeObserverRef.current.observe(container)

    // 마우스 핸들러
    const mouse = new Guacamole.Mouse(displayEl)
    mouseRef.current = mouse

    mouse.onEach(
      ['mousedown', 'mouseup', 'mousemove', 'mouseout'],
      (e: { state: Guacamole.Mouse.State }) => {
        client.sendMouseState(e.state, true)
      }
    )

    // 한글 IME 지원을 위한 숨겨진 textarea 생성
    const imeTextarea = document.createElement('textarea')
    imeTextarea.style.cssText = [
      'position:absolute',
      'opacity:0.01',
      'left:0',
      'top:0',
      'width:1px',
      'height:1px',
      'z-index:-1',
      'resize:none',
      'border:none',
      'outline:none',
      'overflow:hidden',
      'background:transparent',
    ].join(';')
    imeTextarea.setAttribute('autocomplete', 'off')
    imeTextarea.setAttribute('autocorrect', 'off')
    imeTextarea.setAttribute('autocapitalize', 'off')
    imeTextarea.setAttribute('spellcheck', 'false')
    container.appendChild(imeTextarea)
    imeTextareaRef.current = imeTextarea
    imeTextarea.focus()

    // IME 조합 상태 추적 (한글/일본어/중국어)
    let isComposing = false

    imeTextarea.addEventListener('compositionstart', () => {
      isComposing = true
    })

    imeTextarea.addEventListener('compositionend', (e: CompositionEvent) => {
      isComposing = false
      const composed = e.data ?? ''
      for (const char of composed) {
        const cp = char.codePointAt(0) ?? 0
        // 유니코드 keysym: 0x01000000 + 코드포인트
        const keysym = 0x01000000 + cp
        client.sendKeyEvent(1, keysym)
        client.sendKeyEvent(0, keysym)
      }
      // textarea 내용 초기화 (다음 입력을 위해)
      imeTextarea.value = ''
    })

    // 일반 키 입력은 Guacamole.Keyboard로 처리
    const keyboard = new Guacamole.Keyboard(imeTextarea)
    keyboardRef.current = keyboard

    keyboard.onkeydown = (keysym: number) => {
      if (isComposing) return true  // IME 조합 중에는 Guacamole에 전달하지 않음
      client.sendKeyEvent(1, keysym)
      return true
    }
    keyboard.onkeyup = (keysym: number) => {
      if (isComposing) return
      client.sendKeyEvent(0, keysym)
    }

    // 디스플레이 클릭 시 textarea로 포커스 유지
    const focusTextarea = () => imeTextarea.focus()
    displayEl.addEventListener('click', focusTextarea)
    container.addEventListener('mousedown', focusTextarea)

    // 연결 파라미터 빌드 및 연결
    const w = container.clientWidth || 1280
    const h = container.clientHeight || 800
    const params = buildConnectParams(session, activeConnection.identifier, w, h)

    try {
      client.connect(params)
    } catch (e) {
      setSessionState('error')
      setErrorMessage(e instanceof Error ? e.message : '연결에 실패했습니다')
    }

    return () => disconnect()
  }, [activeServer, session, activeConnection, disconnect])

  useEffect(() => {
    return () => {
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current)
    }
  }, [])

  function handleGoBack() {
    disconnect()
    setActiveConnection(null)
    setView('connections')
  }

  function handleReconnect() {
    disconnect()
    setSessionState('connecting')
    setErrorMessage('')
    // 재마운트를 트리거하기 위해 잠시 후 다시 연결
    setTimeout(() => {
      if (!activeServer || !session || !activeConnection || !containerRef.current) return
      const container = containerRef.current
      const wsUrl = buildTunnelUrl(activeServer.url)
      const httpUrl = buildHttpTunnelUrl(activeServer.url)
      const tunnel = new Guacamole.ChainedTunnel(
        new Guacamole.WebSocketTunnel(wsUrl),
        new Guacamole.HTTPTunnel(httpUrl, true)
      )
      const client = new Guacamole.Client(tunnel)
      clientRef.current = client
      const display = client.getDisplay()
      const displayEl = display.getElement()
      displayEl.style.position = 'absolute'
      container.innerHTML = ''
      container.appendChild(displayEl)
      client.onstatechange = (state: number) => {
        if (state === Guacamole.Client.State.CONNECTED) setSessionState('connected')
        else if (state === Guacamole.Client.State.DISCONNECTED) setSessionState('disconnected')
      }
      client.onerror = (status: Guacamole.Status) => {
        setSessionState('error')
        setErrorMessage(status.message || `오류 코드: ${status.code}`)
      }
      const w = container.clientWidth || 1280
      const h = container.clientHeight || 800
      client.connect(buildConnectParams(session, activeConnection.identifier, w, h))
    }, 100)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetToolbarTimer}
      onKeyDown={resetToolbarTimer}
    >
      {/* 과콰몰리 디스플레이 컨테이너 */}
      <div
        ref={containerRef}
        className="absolute inset-0 outline-none"
        style={{ cursor: sessionState === 'connected' ? 'none' : 'default' }}
      />

      {/* 연결 중 오버레이 */}
      {sessionState === 'connecting' && (
        <div className="absolute inset-0 bg-surface/90 flex flex-col items-center justify-center gap-4 z-20 animate-fade-in">
          <svg className="animate-spin text-accent" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
            <path d="M16 4a12 12 0 0112 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <div className="text-center">
            <p className="text-text-primary font-medium">연결 중...</p>
            <p className="text-text-muted text-sm mt-1">{activeConnection?.name}</p>
          </div>
        </div>
      )}

      {/* 연결 해제 오버레이 */}
      {(sessionState === 'disconnected' || sessionState === 'error') && (
        <div className="absolute inset-0 bg-surface/95 flex flex-col items-center justify-center gap-6 z-20 animate-fade-in">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              sessionState === 'error' ? 'bg-error/20' : 'bg-surface-overlay'
            }`}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              {sessionState === 'error' ? (
                <>
                  <circle cx="14" cy="14" r="12" stroke="#e05252" strokeWidth="1.5"/>
                  <path d="M14 8v7M14 18v1.5" stroke="#e05252" strokeWidth="1.5" strokeLinecap="round"/>
                </>
              ) : (
                <>
                  <rect x="2" y="2" width="24" height="17" rx="2" stroke="#666" strokeWidth="1.5"/>
                  <path d="M8 26h12M14 19v7" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 9l10 6-10 6V9z" stroke="#666" strokeWidth="1.2" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </div>

          <div className="text-center">
            <p className="text-text-primary font-semibold text-lg">
              {sessionState === 'error' ? '연결 오류' : '연결이 종료되었습니다'}
            </p>
            {errorMessage && (
              <p className="text-error text-sm mt-1">{errorMessage}</p>
            )}
            <p className="text-text-muted text-sm mt-1">{activeConnection?.name}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleGoBack} className="btn-secondary">
              목록으로
            </button>
            <button onClick={handleReconnect} className="btn-primary">
              재연결
            </button>
          </div>
        </div>
      )}

      {/* 상단 툴바 (세션 활성 시) */}
      {sessionState === 'connected' && (
        <div
          className={`
            absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2
            bg-gradient-to-b from-black/60 to-transparent
            transition-opacity duration-300
            ${showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-black/30 hover:bg-black/50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            목록
          </button>

          <div className="flex-1 text-center">
            <span className="text-xs text-white/70 font-medium">
              {activeConnection?.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* 클립보드 버튼 */}
            <button
              onClick={() => {
                navigator.clipboard.readText().then((text) => {
                  if (clientRef.current && text) {
                    // Guacamole 클립보드 동기화 (향후 구현)
                    console.log('Clipboard sync:', text.length, 'chars')
                  }
                }).catch(() => {})
              }}
              className="p-1.5 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
              title="클립보드 동기화"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="3" width="7" height="8.5" rx="1" stroke="currentColor" strokeWidth="1"/>
                <path d="M3.5 1h5A1 1 0 019.5 2v7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </button>

            {/* 전체화면 버튼 */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
              title={isFullscreen ? '전체화면 해제' : '전체화면'}
            >
              {isFullscreen ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 1.5H1.5v3M1.5 1.5l3 3M7.5 1.5h3v3M10.5 1.5l-3 3M4.5 10.5H1.5v-3M1.5 10.5l3-3M7.5 10.5h3v-3M10.5 10.5l-3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 4.5V1.5h3M1.5 1.5l3 3M10.5 4.5V1.5h-3M10.5 1.5l-3 3M1.5 7.5v3h3M1.5 10.5l3-3M10.5 7.5v3h-3M10.5 10.5l-3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* 연결 해제 버튼 */}
            <button
              onClick={handleGoBack}
              className="p-1.5 text-white/70 hover:text-error bg-black/30 hover:bg-error/20 rounded-lg transition-colors"
              title="연결 해제"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 10.5H2A1.5 1.5 0 01.5 9V3A1.5 1.5 0 012 1.5H4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                <path d="M8 9l3-2.5L8 4M11 6.5H4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
