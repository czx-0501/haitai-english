export async function onRequest(context) {
  const request = context.request;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  const body = await request.json();
  const voiceData = body.voiceData;
  const targetText = (body.text || '').toLowerCase().trim();
  const audioFormat = body.format || 'webm';
  // Accept key from request body or environment
  const azureKey = body.azureKey || context.env.VITE_AZURE_TTS_KEY || '';
  if (!voiceData || !targetText) {
    return new Response(JSON.stringify({ error: 'Missing voiceData or text' }), { status: 400 });
  }
  if (!azureKey) {
    return new Response(JSON.stringify({ error: 'Azure key not configured' }), { status: 500 });
  }
  try {
    const binaryStr = atob(voiceData);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const contentType = audioFormat === 'pcm'
      ? 'audio/L16; rate=16000; channels=1'
      : 'audio/webm';
    const azureUrl = 'https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US';
    const azureRes = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': contentType,
      },
      body: bytes,
    });
    if (!azureRes.ok) {
      return new Response(JSON.stringify({ error: 'Azure STT failed', code: azureRes.status }), { status: azureRes.status });
    }
    const azureData = await azureRes.json();
    var transcript = (azureData.DisplayText || '').toLowerCase().trim().replace(/[.,!?\u2018\u2019]/g, '');
    var expected = targetText;
    var score = 0;
    if (transcript === expected) {
      score = 100;
    } else if (transcript.includes(expected) || expected.includes(transcript)) {
      score = 85;
    } else if (transcript && expected) {
      var common = 0;
      for (var i = 0; i < Math.min(transcript.length, expected.length); i++) {
        if (transcript[i] === expected[i]) common++;
      }
      score = Math.min(99, Math.round(common / expected.length * 90));
    }
    var fb = score >= 90 ? '\u53d1\u97f3\u5f88\u68d2\uff01\u7ee7\u7eed\u4fdd\u6301\uff01'
      : score >= 70 ? '\u53d1\u97f3\u4e0d\u9519\uff0c\u4e2a\u522b\u97f3\u7d20\u9700\u8981\u8c03\u6574'
      : score >= 50 ? '\u53d1\u97f3\u9700\u8981\u591a\u52a0\u7ec3\u4e60'
      : '\u5efa\u8bae\u5148\u4ed4\u7ec6\u542c\u793a\u8303\u53d1\u97f3\u518d\u8ddf\u8bfb';
    return new Response(JSON.stringify({ score: score, transcribed: transcript, expected: targetText, feedback: fb }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error', detail: e.message }), { status: 500 });
  }
}
