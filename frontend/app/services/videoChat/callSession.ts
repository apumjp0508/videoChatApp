import { startCall } from "./startChatOffer";
import { ConnState } from "../../types/VideooChat/callSession";
import { mapToConnState, setConnState, subscribeConnState, getConnState } from "../../utils/mapper/ConnStateMapper";
import { getLocalStream } from "./getMedia";
import { useChatRoomStore } from "../../types/VideooChat/chatRoomStore";
import { useNetworkStore } from "../../types/network/networkStore";
import { monitorNetworkQuality, stopMonitorNetworkQuality } from "./stats/monitorNetworkQuality";
let currentPc: RTCPeerConnection | null = null;
let currentPeerUserId: number | null = null;

function notify() {
  const state: ConnState = currentPc ? mapToConnState(currentlyConnectionState()) : ConnState.None;
  setConnState(state);
  console.log("notify state:", state);
}

function currentlyConnectionState(): RTCPeerConnectionState | "none" {
  return currentPc ? currentPc.connectionState : "none";
}

export async function startOutgoingCall(
  ws: WebSocket,
  toUserId: number,
) {
  const localStream = await getLocalStream();
  const pc = await startCall(ws, toUserId, localStream);
  currentPc = pc;
  currentPeerUserId = toUserId;
  // SSOT: 接続状態通知
  currentPc.onconnectionstatechange = () => {
    notify();
    const connected = currentPc?.connectionState === "connected";
    useChatRoomStore.getState().setConnected(Boolean(connected));
    if (!connected) {
      stopMonitorNetworkQuality(toUserId);
    }
  };
  // ChatRoom SSOT: 反映
  useChatRoomStore.getState().setId(toUserId);
  useChatRoomStore.getState().setLocalStream(localStream);
  useChatRoomStore.getState().setPeerConnection(currentPc);
  // NetworkState: ensure + setPC + streams + monitor
  useNetworkStore.getState().ensure(toUserId);
  useNetworkStore.getState().setPeerConnection(toUserId, currentPc);
  useNetworkStore.getState().setStreams(toUserId, localStream, null);
  monitorNetworkQuality(toUserId, currentPc);
  // 受信トラックでremoteStreamを構築
  currentPc.ontrack = (ev: RTCTrackEvent) => {
    const streams = ev.streams;
    if (streams && streams[0]) {
      useChatRoomStore.getState().setRemoteStream(streams[0]);
      useNetworkStore.getState().setStreams(toUserId, localStream, streams[0]);
    } else if (ev.track) {
      const remote = new MediaStream([ev.track]);
      useChatRoomStore.getState().setRemoteStream(remote);
      useNetworkStore.getState().setStreams(toUserId, localStream, remote);
    }
  };
  notify();
  return currentPc;
}

//受け取った Answer が今の相手か検査
export async function handleRemoteAnswer(
  fromUserId: number,
  sdp: RTCSessionDescriptionInit
) {
  if (!currentPc || currentPeerUserId !== fromUserId) return;
  if (currentPc.signalingState === "stable") return;
  await currentPc.setRemoteDescription(sdp);
  notify();
}

// 統一: 受信/送信どちらでも、fromUserId と状況に応じて ICE を適用
export async function applyRemoteIce(
  fromUserId: number,
  candidate: RTCIceCandidateInit,
  peerByUser?: Map<number, RTCPeerConnection>
) {
  let pc: RTCPeerConnection | null | undefined = null;
  if (peerByUser) {
    pc = peerByUser.get(fromUserId) ?? null;
  } else if (currentPeerUserId === fromUserId) {
    pc = currentPc;
  }
  if (!pc) return;
  await pc.addIceCandidate(candidate);
}

export function subscribeConnectionState(
  cb: (state: ConnState) => void
): () => void {
  return subscribeConnState(cb);
}

export function getConnectionState(): ConnState {
  return getConnState();
}



