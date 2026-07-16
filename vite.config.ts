// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev server handler for /api/voice-compare
function voiceComparePlugin() {
  return {
    name: 'voice-compare',
    configureServer(server) {
      server.middlewares.use('/api/voice-compare', async (req, res, next) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
        const url = new URL(req.url || '', 'http://localhost');
        const targetText = (url.searchParams.get('text') || '').toLowerCase().trim();
        const audioFormat = url.searchParams.get('format') || 'webm';
        const azureKey = req.headers['x-azure-key'] || process.env.VITE_AZURE_TTS_KEY || '';
        if (!targetText) { res.end(JSON.stringify({ error: 'Missing text' })); return; }
        if (!azureKey) { res.end(JSON.stringify({ error: 'no azure key' })); return; }
        let chunks: Buffer[] = [];
        req.on('data', (c: any) => chunks.push(c));
        req.on('end', async () => {
          try {
            const buf = Buffer.concat(chunks);
            if (buf.length === 0) { res.end(JSON.stringify({ error: 'empty audio' })); return; }
            const ct = audioFormat === 'pcm' ? 'audio/L16; rate=16000; channels=1' : (req.headers['content-type'] || 'audio/webm');
            const azureRes = await fetch('https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US', {
              method: 'POST',
              headers: { 'Ocp-Apim-Subscription-Key': azureKey, 'Content-Type': ct },
              body: buf,
            });
            if (!azureRes.ok) { res.end(JSON.stringify({ error: 'azure failed', code: azureRes.status })); return; }
            const azureData: any = await azureRes.json();
            const transcript = (azureData.DisplayText || '').toLowerCase().trim().replace(/[.,!?]/g, '');
            const expected = (text || '').toLowerCase().trim();
            let score = 0;
            if (transcript === expected) score = 100;
            else if (transcript.includes(expected) || expected.includes(transcript)) score = 85;
            else if (transcript && expected) {
              let common = 0;
              for (let i = 0; i < Math.min(transcript.length, expected.length); i++) {
                if (transcript[i] === expected[i]) common++;
              }
              score = Math.min(99, Math.round(common / expected.length * 90));
            }
            const fb = score >= 90 ? '发音很棒！继续保持！' : score >= 70 ? '发音不错，个别音素需要调整' : score >= 50 ? '发音需要多加练习' : '建议先仔细听示范发音再跟读';
            res.end(JSON.stringify({ score, transcribed: transcript || '', expected: text, feedback: fb }));
          } catch (e: any) { res.end(JSON.stringify({ error: e.message || 'unknown' })); }
        });
      });
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), voiceComparePlugin()],
  server: {
    proxy: {
      '/azure-stt': {
        target: 'https://eastasia.stt.speech.microsoft.com',
        changeOrigin: true,
        rewrite: (_path) => '/speech/recognition/conversation/cognitiveservices/v1?language=en-US',
      },
      '/api': {
        target: 'http://localhost:5188',
        changeOrigin: true,
      }
    }
  }
})
