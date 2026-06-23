/**
 * TTS 发音工具
 * 1. 优先 Azure TTS（部署后生效）
 * 2. 备选 macOS say 命令（本地开发）
 * 3. 最后回退浏览器 Web Speech API
 */

function getAzureKey() {
  return import.meta.env.VITE_AZURE_TTS_KEY || '';
}

function getAzureRegion() {
  return import.meta.env.VITE_AZURE_TTS_REGION || 'eastasia';
}

/**
 * 预加热语音引擎（解决 iOS WKWebView 首次发音延迟）
 * 在 App 启动时调用，让引擎提前加载
 */
export function prewarmTTS(): void {
  if (!('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance('a');
    window.speechSynthesis.speak(u);
    setTimeout(() => window.speechSynthesis.cancel(), 5);
    window.speechSynthesis.getVoices();
  } catch {}
}

export async function speak(text: string): Promise<void> {
  if (!text.trim()) return;

  // 检测是否在 Capacitor 原生环境（iOS App），跳过网络请求方案
  const isNative = !!((window as any).Capacitor?.isNativePlatform?.());
  if (isNative) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
    return;
  }

  // 方案 A：Azure TTS（部署到线上时自动启用）
  const azureKey = getAzureKey();
  if (azureKey) {
    try {
      const ttsUrl = `https://${getAzureRegion()}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const ssml = `<speak version='1.0' xml:lang='en-US'>
        <voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyNeural'>
          ${text}
        </voice>
      </speak>`;

      const res = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        },
        body: ssml,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        return new Promise((resolve) => {
          const audio = new Audio(url);
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
        });
      }
    } catch { /* fall through */ }
  }

  // 方案 B：macOS say 命令（本地开发）
  try {
    const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&voice=Samantha`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
      });
    }
  } catch { /* fall through */ }

  // 方案 C：浏览器 TTS（最终回退）
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}

export function preloadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.getVoices();
}
