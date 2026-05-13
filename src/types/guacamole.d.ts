declare module 'guacamole-common-js' {
  namespace Guacamole {
    class Tunnel {
      connect(data?: string): void
      disconnect(): void
      sendMessage(...elements: unknown[]): void
      state: number
      onerror: ((status: Status) => void) | null
      onstatechange: ((state: number) => void) | null
      static readonly State: {
        CONNECTING: number
        OPEN: number
        CLOSED: number
        UNSTABLE: number
      }
    }

    class WebSocketTunnel extends Tunnel {
      constructor(tunnelURL: string)
    }

    class HTTPTunnel extends Tunnel {
      constructor(tunnelURL: string, crossDomain?: boolean, extraTunnelHeaders?: Record<string, string>)
    }

    class ChainedTunnel extends Tunnel {
      constructor(...tunnels: Tunnel[])
    }

    class Client {
      constructor(tunnel: Tunnel)
      connect(data?: string): void
      disconnect(): void
      getDisplay(): Display
      sendKeyEvent(pressed: number, keysym: number): void
      sendMouseState(mouseState: Mouse.State, applyDisplayScale?: boolean): void
      sendSize(width: number, height: number): void
      exportState(callback: (state: object) => void): void
      importState(state: object): void
      onerror: ((status: Status) => void) | null
      onstatechange: ((state: number) => void) | null
      onname: ((name: string) => void) | null
      onclipboard: ((stream: InputStream, mimetype: string) => void) | null
      static readonly State: {
        IDLE: number
        CONNECTING: number
        WAITING: number
        CONNECTED: number
        DISCONNECTING: number
        DISCONNECTED: number
      }
    }

    class Display {
      getElement(): HTMLElement
      getDefaultLayer(): VisibleLayer
      scale(scale: number): void
      getWidth(): number
      getHeight(): number
      getScale(): number
      showCursor(visible: boolean): void
      onresize: ((width: number, height: number) => void) | null
      oncursor: ((canvas: HTMLCanvasElement, x: number, y: number) => void) | null
    }

    class VisibleLayer {
      getCanvas(): HTMLCanvasElement
    }

    class Mouse {
      constructor(element: HTMLElement)
      onEach(
        events: string[],
        handler: (e: { state: Mouse.State }) => void
      ): void
      on(event: string, handler: (e: { state: Mouse.State }) => void): void
    }

    namespace Mouse {
      class State {
        constructor(
          x: number,
          y: number,
          left: boolean,
          middle: boolean,
          right: boolean,
          up: boolean,
          down: boolean
        )
        x: number
        y: number
        left: boolean
        middle: boolean
        right: boolean
        up: boolean
        down: boolean
      }
    }

    class Keyboard {
      constructor(element: HTMLElement | Document)
      onkeydown: ((keysym: number) => void | boolean) | null
      onkeyup: ((keysym: number) => void) | null
      reset(): void
      press(keysym: number): void
      release(keysym: number): void
    }

    class InputStream {
      sendAck(message: string, code: number): void
      onblob: ((data: string) => void) | null
      onend: (() => void) | null
    }

    class Status {
      code: number
      message: string
      constructor(code: number, message?: string)
    }
  }

  export = Guacamole
}
