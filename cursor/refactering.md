目的
PeerConnection 確立後に chatRoom/page.tsx で自動的にビデオ通話を開始する。
状態は SSOT（単一の真実の場所）としてストアで一元管理し、UI は購読のみを行う。
既存の ConnState SSOT（ConnStateMapper.ts）と整合を取る。
データ構造（型/ストア）
型（types/chatRoom.ts）
ChatRoomSession = { id: number | null; peerConnection: RTCPeerConnection | null; localStream: MediaStream | null; remoteStream: MediaStream | null; isConnected: boolean }
ストア（types/chatRoomStore.ts / Zustand）
session: ChatRoomSession
actions:
setId(id), setPeerConnection(pc), setLocalStream(stream), setRemoteStream(stream), setConnected(boolean), reset()
ChatRoom サービス層リファクタ（getMedia 分離）
目的
navigator.mediaDevices を直接呼ばず、メディア取得を services/videoChat/getMedia.ts に集約。
発信/受信フローは共通のメディアAPIを利用し、将来の入力切替（画面共有/複数人）にも対応しやすくする。
追加/変更ファイル
追加: frontend/app/services/videoChat/getMedia.ts
getLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream>
（将来拡張）getDisplayStream(), selectInputDevice(...) など
変更: frontend/app/services/videoChat/callSession.ts
既存の getLocalStream を削除し、getMedia.getLocalStream を使用
chatRoomStore への反映（local/pc/remote/isConnected）を実装
変更: frontend/app/services/videoChat/startChatOffer.ts
受信側 acceptCall でも getMedia.getLocalStream を使用
ontrack / onconnectionstatechange でストア/SSOT同期
実装詳細
services/videoChat/getMedia.ts（新規）
export async function getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  return stream;
}
// 予備（将来）
// export async function getDisplayStream(): Promise<MediaStream> { ... }
services/videoChat/callSession.ts（発信側）
置換点:
const local = await getLocalStream() → pc.addTrack しつつ chatRoomStore.setLocalStream(local)
chatRoomStore.setPeerConnection(pc) を開始時に反映
pc.ontrack = (e) => setRemoteStream(mergeTracks(e.streams/e.track))
pc.onconnectionstatechange = () => { setConnState(mapToConnState(pc.connectionState)); chatRoomStore.setConnected(pc.connectionState === "connected"); }
handleRemoteAnswer 完了時にも冪等に setConnected(...) を再評価
擬似コード:

import { getLocalStream } from "./getMedia";
import { setConnState, mapToConnState } from "../../utils/mapper/ConnStateMapper";
import { useChatRoomStore } from "../../types/chatRoomStore";

export async function startOutgoingCall(ws, toUserId) {
  const local = await getLocalStream();
  const pc = new RTCPeerConnection({ iceServers: [...] });
  local.getTracks().forEach(t => pc.addTrack(t, local));
  useChatRoomStore.getState().setLocalStream(local);
  useChatRoomStore.getState().setPeerConnection(pc);
  pc.ontrack = (ev) => {
    const remote = ensureRemoteStream(ev);
    useChatRoomStore.getState().setRemoteStream(remote);
  };
  pc.onconnectionstatechange = () => {
    const s = mapToConnState(pc.connectionState);
    setConnState(s);
    useChatRoomStore.getState().setConnected(s === "connected");
  };
  // 既存のoffer送出は従来通り
}
services/videoChat/startChatOffer.ts（受信側）
置換点:
const local = await getLocalStream() → pc.addTrack / setLocalStream
pc.ontrack / pc.onconnectionstatechange は発信側と同様の更新を実装
擬似コード:

import { getLocalStream } from "./getMedia";
import { setConnState, mapToConnState } from "../../utils/mapper/ConnStateMapper";
import { useChatRoomStore } from "../../types/chatRoomStore";

export async function acceptCall(ws, fromUserId, offerSdp) {
  const pc = new RTCPeerConnection({ iceServers: [...] });
  const local = await getLocalStream();
  local.getTracks().forEach(t => pc.addTrack(t, local));
  useChatRoomStore.getState().setLocalStream(local);
  useChatRoomStore.getState().setPeerConnection(pc);
  pc.ontrack = (ev) => {
    const remote = ensureRemoteStream(ev);
    useChatRoomStore.getState().setRemoteStream(remote);
  };
  pc.onconnectionstatechange = () => {
    const s = mapToConnState(pc.connectionState);
    setConnState(s);
    useChatRoomStore.getState().setConnected(s === "connected");
  };
  // 既存のsetRemoteDescription→createAnswer→setLocalDescription→sendAnswer は従来通り
}
※ ensureRemoteStream は受信イベントから MediaStream を一意に生成/更新するユーティリティ（初回作成・以後は addTrack）。

影響範囲/互換
UI/Hook 側（useChatRoomSession, chatRoom/page.tsx）の仕様は変更なし。ストアを購読するだけで動作。
既存の SSOT（ConnStateMapper.ts）と整合（setConnState は従来通り呼ぶ）。
動作確認
発信/受信の双方で localStream/remoteStream がストアに反映され、connected で isConnected=true。
chatRoom で srcObject にセットされ映像/音声が再生される。
既存の startChat → /loading → /chatRoom 遷移フローに影響がないこと。

フック（UI用）
hook/useChatRoomSession.ts
chatRoomStore.session を購読して UI へ返却
ConnState SSOT を購読し isConnected = (state === "connected") を chatRoomStore.setConnected に同期（冪等OK）
アンマウント時 reset()
画面実装（app/(public)/chatRoom/page.tsx）
useChatRoomSession() を使用
isConnected === true になったら:
<video ref={localRef} autoPlay playsInline muted /> に localStream を srcObject でバインド
<video ref={remoteRef} autoPlay playsInline /> に remoteStream を srcObject でバインド
クリーンアップ:
アンマウント時に localStream.getTracks().forEach(t => t.stop())、reset()
イベント配線の要点
発信時（startOutgoingCall）
localStream を取得・追加→ストア反映
ontrack で remoteStream をストア反映
onconnectionstatechange で isConnected をストア反映
受信時（acceptCall）
同上の流れで localStream/remoteStream/isConnected を反映
既存との整合性
ConnStateMapper.ts を真とし、isConnected = ConnState === Connected を一貫して使用
useGlobalSignalingListener による onAnswer/onIce の常時適用は継続（本設計と矛盾しない）
startChat/page.tsx の Connected → /chatRoom 遷移は維持（重複遷移防止に注意）
実装ステップ
types/chatRoom.ts と types/chatRoomStore.ts を追加
callSession.ts / startChatOffer.ts に ontrack とストア反映（local/remote/pc）を組み込み
hook/useChatRoomSession.ts を追加（SSOT購読→isConnected 同期）
chatRoom/page.tsx で動画2面描画・srcObject バインド・クリーンアップ
動作確認（発信/受信の双方で connected 到達後に映像/音声が流れる）
注意点
HTMLVideoElement.srcObject = stream は ref 経由で直接設定（JS側）
ontrack は複数回発火しうるため、remoteStream の作成/更新は重複に注意
クリーンアップ時に MediaStreamTrack.stop() を必ず実行