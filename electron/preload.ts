import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 설정 저장소
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    getAll: () => ipcRenderer.invoke('store:getAll'),
  },

  // HTTP 요청 프록시 (CORS 우회)
  http: {
    request: (opts: {
      url: string
      method: string
      headers?: Record<string, string>
      body?: string
    }) => ipcRenderer.invoke('http:request', opts),
  },

  // 윈도우 컨트롤
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // 플랫폼 정보
  platform: process.platform,
})
