export {}

declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
        delete: (key: string) => Promise<void>
        getAll: () => Promise<Record<string, unknown>>
      }
      http: {
        request: (opts: {
          url: string
          method: string
          headers?: Record<string, string>
          body?: string
        }) => Promise<{ status: number; data: string }>
      }
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
      }
      platform: NodeJS.Platform
    }
  }
}
