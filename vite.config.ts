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
        let targetText = (url.searchParams.get('text') || '').toLowerCase().trim();
        let azureKey = process.env.VITE_AZURE_TTS_KEY || '';
        if (!targetText) { res.end(JSON.stringify({ error: 'Missing text' })); return; }
        if (!azureKey) { res.end(JSON.stringify({ error: 'no azure key' })); return; }

        let chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          try {
            const raw = Buffer.concat(chunks);
            if (raw.length === 0) { res.end(JSON.stringify({ error: 'empty audio' })); return; }

            // Support both raw binary and JSON+base64 formats
            const ct = req.headers['content-type'] || '';
            let audioBody;
            let mimeType = 'audio/webm';

            if (ct.includes('application/json')) {
              const jsonBody = JSON.parse(raw.toString('utf8'));
              azureKey = jsonBody.azureKey || azureKey;
              if (jsonBody.text) targetText = jsonBody.text.toLowerCase().trim();
              mimeType = jsonBody.format === 'pcm' ? 'audio/L16; rate=16000; channels=1' : 'audio/webm';
              const b64 = jsonBody.voiceData;
              if (!b64) { res.end(JSON.stringify({ error: 'Missing voiceData' })); return; }
              audioBody = Buffer.from(b64, 'base64');
            } else {
              audioBody = raw;
              mimeType = ct || 'audio/webm';
            }

            const azureRes = await fetch('https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US', {
              method: 'POST',
              headers: { 'Ocp-Apim-Subscription-Key': azureKey, 'Content-Type': mimeType },
              body: audioBody,
            });
            if (!azureRes.ok) { res.end(JSON.stringify({ error: 'azure failed', code: azureRes.status })); return; }
            const azureData = await azureRes.json();
            const transcript = (azureData.DisplayText || '').toLowerCase().trim().replace(/[.,!?]/g, '');
            let score = 0;
            if (transcript === targetText) score = 100;
            else if (transcript.includes(targetText) || targetText.includes(transcript)) score = 85;
            else if (transcript && targetText) {
              let common = 0;
              for (let i = 0; i < Math.min(transcript.length, targetText.length); i++) {
                if (transcript[i] === targetText[i]) common++;
              }
              score = Math.min(99, Math.round(common / targetText.length * 90));
            }
            const fb = score >= 90 ? '发音很棒！继续保持！' : score >= 70 ? '发音不错，个别音素需要调整' : score >= 50 ? '发音需要多加练习' : '建议先仔细听示范发音再跟读';
            res.end(JSON.stringify({ score, transcribed: transcript || '', expected: targetText, feedback: fb }));
          } catch (e) { res.end(JSON.stringify({ error: e.message || 'unknown' })); }
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
