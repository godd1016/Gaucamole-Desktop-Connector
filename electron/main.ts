import { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

const STORE_PATH = path.join(app.getPath('userData'), 'settings.json')

let win: BrowserWindow | null = null
let tray: Tray | null = null

// ─── Settings Store ───────────────────────────────────────────────────────────
function readStore(): Record<string, unknown> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    }
  } catch {
    // ignore corrupt data
  }
  return {}
}

function writeStore(data: Record<string, unknown>) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write store:', e)
  }
}

ipcMain.handle('store:get', (_, key: string) => {
  return readStore()[key]
})

ipcMain.handle('store:set', (_, key: string, value: unknown) => {
  const store = readStore()
  store[key] = value
  writeStore(store)
})

ipcMain.handle('store:delete', (_, key: string) => {
  const store = readStore()
  delete store[key]
  writeStore(store)
})

ipcMain.handle('store:getAll', () => {
  return readStore()
})

// ─── HTTP Request Proxy (CORS 우회) ──────────────────────────────────────────
interface HttpRequestOptions {
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
}

function makeRequest(opts: HttpRequestOptions): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(opts.url)
    const isHttps = urlObj.protocol === 'https:'
    const lib = isHttps ? https : http

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: opts.method,
      headers: opts.headers || {},
      rejectUnauthorized: false, // 자체 서명 인증서 허용
    }

    const req = lib.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ status: res.statusCode ?? 0, data })
      })
    })

    req.on('error', reject)

    if (opts.body) {
      req.write(opts.body)
    }
    req.end()
  })
}

ipcMain.handle('http:request', async (_, opts: HttpRequestOptions) => {
  try {
    return await makeRequest(opts)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(msg)
  }
})

// ─── Window ──────────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 860,
    minHeight: 580,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: fs.existsSync(path.join(__dirname, 'preload.mjs'))
        ? path.join(__dirname, 'preload.mjs')
        : path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Guacamole WS 연결 허용
    },
    icon: path.join(process.env.APP_ROOT!, 'public', 'icon.png'),
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toISOString())
  })

  // 외부 링크는 기본 브라우저로 열기
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ─── Window Controls IPC ─────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => win?.minimize())
ipcMain.on('window:maximize', () => {
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})
ipcMain.on('window:close', () => win?.close())
ipcMain.handle('window:isMaximized', () => win?.isMaximized() ?? false)

// ─── Tray ─────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(process.env.APP_ROOT!, 'public', 'icon.png')
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(icon)
  tray.setToolTip('GuacDesktop')

  const menu = Menu.buildFromTemplate([
    { label: '열기', click: () => { win?.show(); win?.focus() } },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => { win?.show(); win?.focus() })
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    tray?.destroy()
    app.quit()
  }
})
