export async function onRequest(context) {
  const request = context.request;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  const url = new URL(request.url);
  let targetText = (url.searchParams.get('text') || '').toLowerCase().trim();
  let azureKey = request.headers.get('x-azure-key') || context.env.VITE_AZURE_TTS_KEY || '';

  if (!targetText) {
    return new Response(JSON.stringify({ error: 'Missing text parameter' }), { status: 400 });
  }
  if (!azureKey) {
    return new Response(JSON.stringify({ error: 'Azure key not configured' }), { status: 500 });
  }

  try {
    // Support both raw binary and JSON+base64 formats
    const contentType = request.headers.get('content-type') || '';
    let audioBody;
    let mimeType = 'audio/webm';

    if (contentType.includes('application/json')) {
      // JSON mode: extract base64 voiceData, decode it
      const jsonBody = await request.json();
      azureKey = jsonBody.azureKey || azureKey;
      if (jsonBody.text) targetText = jsonBody.text.toLowerCase().trim();
      mimeType = jsonBody.format === 'pcm' ? 'audio/L16; rate=16000; channels=1' : 'audio/webm';
      const b64 = jsonBody.voiceData;
      if (!b64) {
        return new Response(JSON.stringify({ error: 'Missing voiceData in JSON body' }), { status: 400 });
      }
      // Decode base64 to binary
      const binaryStr = atob(b64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      audioBody = bytes.buffer;
    } else {
      // Raw binary mode
      audioBody = await request.arrayBuffer();
      const fmt = url.searchParams.get('format') || 'webm';
      mimeType = fmt === 'pcm' ? 'audio/L16; rate=16000; channels=1' : (contentType || 'audio/webm');
    }

    if (!audioBody || audioBody.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'Empty audio data' }), { status: 400 });
    }

    const azureUrl = 'https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US';
    const azureRes = await fetch(azureUrl, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': azureKey, 'Content-Type': mimeType },
      body: audioBody,
    });
    if (!azureRes.ok) {
      return new Response(JSON.stringify({ error: 'Azure STT failed', code: azureRes.status }), { status: azureRes.status });
    }
    const azureData = await azureRes.json();
    var transcript = (azureData.DisplayText || '').toLowerCase().trim().replace(/[.,!?'\u2018\u2019]/g, '');
    var expected = targetText;
    var score = 0;
    if (transcript === expected) {
      score = 100;
    } else if (transcript && (transcript.includes(expected) || expected.includes(transcript))) {
      score = 85;
    } else if (transcript && expected) {
      var common = 0;
      for (var i = 0; i < Math.min(transcript.length, expected.length); i++) {
        if (transcript[i] === expected[i]) common++;
      }
      score = Math.min(99, Math.round(common / expected.length * 90));
    }
    var fb = score >= 90 ? '发音很棒！继续保持！'
      : score >= 70 ? '发音不错，个别音素需要调整'
      : score >= 50 ? '发音需要多加练习'
      : '建议先仔细听示范发音再跟读';
    return new Response(JSON.stringify({ score: score, transcribed: transcript, expected: targetText, feedback: fb }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error', detail: e.message }), { status: 500 });
  }
}
