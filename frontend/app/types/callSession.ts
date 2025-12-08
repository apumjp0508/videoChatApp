import { User } from "./userStore";

export interface CallSession {
    peerConnection: RTCPeerConnection;
    localStream: MediaStream;
    remoteStream?: MediaStream;
    user: User;
    connectionState: ConnState;
  }
  

export enum ConnState {
    None = "none",
    New = "new",
    Connecting = "connecting",
    Connected = "connected",
    Disconnected = "disconnected",
    Failed = "failed",
    Closed = "closed",
}
  