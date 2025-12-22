// src/utils/rtcStateMapper.ts
import { ConnState } from "../../types/VideooChat/callSession";

export function mapToConnState(state: RTCPeerConnectionState | "none"): ConnState {
  switch (state) {
    case "new":
      return ConnState.New;
    case "connecting":
      return ConnState.Connecting;
    case "connected":
      return ConnState.Connected;
    case "disconnected":
      return ConnState.Disconnected;
    case "failed":
      return ConnState.Failed;
    case "closed":
      return ConnState.Closed;
    default:
      return ConnState.None;  
  }
}

// -------- SSOT: Connection State Store --------
let currentState: ConnState = ConnState.None;
const subscribers = new Set<(s: ConnState) => void>();

export function setConnState(state: ConnState) {
  currentState = state;
  for (const fn of subscribers) {
    try {
      fn(state);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("ConnState subscriber error:", e);
    }
  }
}

export function getConnState(): ConnState {
  return currentState;
}

export function subscribeConnState(cb: (s: ConnState) => void): () => void {
  subscribers.add(cb);
  try {
    cb(currentState);
  } catch {}
  return () => subscribers.delete(cb);
}
