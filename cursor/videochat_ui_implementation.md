# ビデオチャットUI実装方針（useVideoChatUI + chatRoom統合）

## 目的
- PeerConnection が確立したときのみビデオ通話UI（ローカル/リモートの2面）を描画する。
- データと状態は SSOT（`chatRoomStore`）から取得し、UIは購読と描画のみに限定する。
- 既存の接続状態 SSOT（`ConnStateMapper.ts`）と整合する。

## 新規フック設計: useVideoChatUI
### 役割
- `chatRoomStore.session` を購読して `localStream`, `remoteStream`, `isConnected` を受け取り、`HTMLVideoElement.srcObject` に安全にバインドする。
- `isConnected` のときのみ描画する `VideoChatView` を返す。

### 返却API（想定）
```ts
type UseVideoChatUIReturn = {
  isConnected: boolean;
  VideoChatView: React.ReactElement | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}
```

### 実装要点
- `const { session } = useChatRoomStore();`
- `const localRef = useRef<HTMLVideoElement>(null);`
- `const remoteRef = useRef<HTMLVideoElement>(null);`
- `useEffect` でストリーム変更時に `ref.current!.srcObject = stream` をセット。
- `isConnected === true` でのみ以下のUIを返す（例）。

```tsx
const VideoChatView = isConnected ? (
  <div className="fixed inset-0 pointer-events-none">
    <video
      ref={remoteRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
    <video
      ref={localRef}
      autoPlay
      playsInline
      muted
      className="w-40 h-28 object-cover absolute bottom-4 right-4 rounded shadow-lg"
    />
  </div>
) : null;
```

## chatRoom/page.tsx への統合
1. `const { isConnected, VideoChatView } = useVideoChatUI();`
2. ページルートに `{VideoChatView}` を重ねて描画（fixed/absolute でオーバーレイ）。
3. 既存のチャットUIはそのまま動作（ビデオはオーバーレイ表示）。

例（概略）:
```tsx
export default function ChatRoom() {
  const { isConnected, VideoChatView } = useVideoChatUI();
  return (
    <main className="relative h-screen">
      {VideoChatView}
      {/* 既存のUI */}
    </main>
  );
}
```

## クリーンアップ（退出時）
- 退出ボタンで以下を実行（ユースケース関数化推奨）:
  - `useChatRoomStore.getState().session.localStream?.getTracks().forEach(t => t.stop())`
  - `useChatRoomStore.getState().session.peerConnection?.close()`
  - `useChatRoomStore.getState().reset()`

## 注意点
- ブラウザのオートプレイポリシーを満たすため、ローカル映像は `muted` を必須にする。
- iOS などでの再生のため `playsInline` を付ける。
- `ontrack` は複数回発火し得るため、`remoteStream` の生成/更新は重複に注意（初回作成→以後は同一ストリームへ `addTrack` 戦略でも可）。
- `useVideoChatUI` はページで1回だけ使用（多重バインド回避）。

## 実装ステップ
1. `hook/useVideoChatUI.tsx` を追加（上記のrefバインドとJSX生成を実装）。
2. `app/(public)/chatRoom/page.tsx` で `useVideoChatUI` を呼び、`{VideoChatView}` を描画。
3. 退出ユースケース（任意）を実装してクリーンアップを確実化。

## 動作確認チェックリスト
- [ ] 発信側/受信側ともに `connected` 達成後に `VideoChatView` が表示される。
- [ ] ローカル映像はミュートで再生される（エラーなし）。
- [ ] リモート映像/音声が再生される（デバイス権限・接続が正常な場合）。
- [ ] 退出時にストリーム停止・PeerConnection クローズ・ストアリセットが行われる。 

