/**
 * エネルギーベース VAD
 * - PCM: Int16Array（mono / 16kHz）
 * - 戻り値: true = 音声あり
 */
export function isSpeechFrame(
  pcm: Int16Array,
  options?: {
    threshold?: number;   // 平均振幅のしきい値
    minLength?: number;   // 最小サンプル数
  }
): boolean {
  const threshold = options?.threshold ?? 500;
  const minLength = options?.minLength ?? 160; // 10ms @16kHz

  if (pcm.length < minLength) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < pcm.length; i++) {
    sum += Math.abs(pcm[i]);
  }

  const avgEnergy = sum / pcm.length;
  return avgEnergy > threshold;
}
