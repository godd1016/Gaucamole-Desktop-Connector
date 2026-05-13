export interface ServerConfig {
  url: string        // e.g. http://192.168.1.100:8080/guacamole
  displayName: string
}

export interface GuacConnection {
  identifier: string
  name: string
  protocol: string
  activeConnections: number
  lastActive?: number
  attributes?: Record<string, string>
  parentIdentifier?: string
}

export interface GuacSession {
  authToken: string
  dataSource: string
  username: string
  availableDataSources: string[]
}

export type AppView =
  | 'setup'        // 서버 미설정
  | 'login'        // 로그인 화면
  | 'connections'  // 연결 목록
  | 'session'      // 원격 세션 활성

export type Protocol = 'rdp' | 'vnc' | 'ssh' | 'telnet' | 'kubernetes'
