<!-- 8e6ec2cb-f522-4117-84a0-b32c42a1c19e 07eb6bda-3698-45ff-8bd8-188ae594327b -->
# ChatRoom サービス層リファクタ（getMedia 分離）

## 目的

- `navigator.mediaDevices` を直接呼ばず、メディア取得を `services/videoChat/getMedia.ts` に集約。
- 発信/受信フローは共通のメディアAPIを利用し、将来の入力切替（画面共有/複数人）にも対応しやすくする。

## 追加/変更ファイル

- 追加: `frontend/app/services/videoChat/getMedia.ts`
  - `getLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream>`
  - （将来拡張）`getDisplayStream()`, `selectInputDevice(...)` など
- 変更: `frontend/app/services/videoChat/callSession.ts`
  - 既存の `getLocalStream` を削除し、`getMedia.getLocalStream` を使用
  - `chatRoomStore` への反映（local/pc/remote/isConnected）を実装
- 変更: `frontend/app/services/videoChat/startChatOffer.ts`
  - 受信側 `acceptCall` でも `getMedia.getLocalStream` を使用
  - `ontrack` / `onconnectionstatechange` でストア/SSOT同期

## 実装詳細

### services/videoChat/getMedia.ts（新規）

```ts
export async function getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  return stream;
}
// 予備（将来）
// export async function getDisplayStream(): Promise<MediaStream> { ... }
```

### services/videoChat/callSession.ts（発信側）

- 置換点:
  - `const local = await getLocalStream()` → `pc.addTrack` しつつ `chatRoomStore.setLocalStream(local)`
  - `chatRoomStore.setPeerConnection(pc)` を開始時に反映
  - `pc.ontrack = (e) => setRemoteStream(mergeTracks(e.streams/e.track))`
  - `pc.onconnectionstatechange = () => { setConnState(mapToConnState(pc.connectionState)); chatRoomStore.setConnected(pc.connectionState === "connected"); }`
  - `handleRemoteAnswer` 完了時にも冪等に `setConnected(...)` を再評価

擬似コード:

```ts
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
```

### services/videoChat/startChatOffer.ts（受信側）

- 置換点:
  - `const local = await getLocalStream()` → `pc.addTrack` / `setLocalStream`
  - `pc.ontrack` / `pc.onconnectionstatechange` は発信側と同様の更新を実装

擬似コード:

```ts
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
```

※ `ensureRemoteStream` は受信イベントから `MediaStream` を一意に生成/更新するユーティリティ（初回作成・以後は `addTrack`）。

## 影響範囲/互換

- UI/Hook 側（`useChatRoomSession`, `chatRoom/page.tsx`）の仕様は変更なし。ストアを購読するだけで動作。
- 既存の SSOT（`ConnStateMapper.ts`）と整合（`setConnState` は従来通り呼ぶ）。

## 動作確認

- 発信/受信の双方で `localStream`/`remoteStream` がストアに反映され、`connected` で `isConnected=true`。
- `chatRoom` で `srcObject` にセットされ映像/音声が再生される。
- 既存の `startChat` → `/loading` → `/chatRoom` 遷移フローに影響がないこと。