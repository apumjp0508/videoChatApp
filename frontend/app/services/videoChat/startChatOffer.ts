import { sendOffer, sendIce, sendAnswer } from "../websocket/signaling";
import { getLocalStream } from "./getMedia";
import { mapToConnState, setConnState } from "../../utils/mapper/ConnStateMapper";
import { useChatRoomStore } from "../../types/chatRoomStore";
import { useNetworkStore } from "../../types/networkStore";
import { monitorNetworkQuality, stopMonitorNetworkQuality } from "./stats/monitorNetworkQuality";

export async function startCall(
  ws: WebSocket,
  toUserId: number,
  localStream?: MediaStream
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({
    //ここで通信経路を探し出してくれるサーバーを設定している。
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  //localstream はカメラやマイクのこと

  if (localStream) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }

  //onicecandidate イベントは、その候補経路を見つけるたびに発火し、

  pc.onicecandidate = (ev) => {
    console.log("ev:", ev);
    if (ev.candidate) {
      const cand: RTCIceCandidateInit = {
        candidate: ev.candidate.candidate,
        sdpMid: ev.candidate.sdpMid ?? undefined,
        sdpMLineIndex: ev.candidate.sdpMLineIndex ?? undefined,
      };
      sendIce(ws, toUserId, cand);
    }
  };

  // 接続状態をSSOTへ反映
  pc.onconnectionstatechange = () => {
    setConnState(mapToConnState(pc.connectionState));
    const connected = pc.connectionState === "connected";
    useChatRoomStore.getState().setConnected(Boolean(connected));
    if (!connected) {
      stopMonitorNetworkQuality(toUserId);
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendOffer(ws, toUserId, offer);

  return pc;
}

// 受信側: オファーを受け取り、アンサーを返す
export async function acceptCall(
  ws: WebSocket,
  fromUserId: number,
  offerSdp: RTCSessionDescriptionInit,
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const localStream = await getLocalStream();
  // ChatRoom反映
  useChatRoomStore.getState().setId(fromUserId);
  useChatRoomStore.getState().setLocalStream(localStream);
  useChatRoomStore.getState().setPeerConnection(pc);
  // NetworkState反映
  useNetworkStore.getState().ensure(fromUserId);
  useNetworkStore.getState().setPeerConnection(fromUserId, pc);
  useNetworkStore.getState().setStreams(fromUserId, localStream, null);
  monitorNetworkQuality(fromUserId, pc);

  if (localStream) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      const cand: RTCIceCandidateInit = {
        candidate: ev.candidate.candidate,
        sdpMid: ev.candidate.sdpMid ?? undefined,
        sdpMLineIndex: ev.candidate.sdpMLineIndex ?? undefined,
      };
      sendIce(ws, fromUserId, cand);
    }else{
      console.log("ev.candidate is null");
    }
  };

  // 受信側でも接続状態をSSOTへ反映
  pc.onconnectionstatechange = () => {
    setConnState(mapToConnState(pc.connectionState));
    const connected = pc.connectionState === "connected";
    useChatRoomStore.getState().setConnected(Boolean(connected));
    if (!connected) {
      stopMonitorNetworkQuality(fromUserId);
    }
  };
  // 受信トラックの反映
  pc.ontrack = (ev: RTCTrackEvent) => {
    const streams = ev.streams;
    if (streams && streams[0]) {
      useChatRoomStore.getState().setRemoteStream(streams[0]);
      useNetworkStore.getState().setStreams(fromUserId, localStream, streams[0]);
    } else if (ev.track) {
      const remote = new MediaStream([ev.track]);
      useChatRoomStore.getState().setRemoteStream(remote);
      useNetworkStore.getState().setStreams(fromUserId, localStream, remote);
    }
  };

  await pc.setRemoteDescription(offerSdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendAnswer(ws, fromUserId, answer);

  return pc;
}