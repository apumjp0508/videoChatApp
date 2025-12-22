import { create } from 'zustand'

type WebSocketState = {
  ws: WebSocket | null
  setWS: (socket: WebSocket | null) => void
  clearWS: () => void
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  ws: null,
  setWS: (socket) => set({ ws: socket }),
  clearWS: () => set({ ws: null }),
}))


