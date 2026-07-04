export async function onRequest(context) {
  const request = context.request;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const azureKey = context.env.VITE_AZURE_TTS_KEY;
  if (!azureKey) {
    return new Response(JSON.stringify({ error: 'Azure key not configured' }), { status: 500 });
  }
  const azureUrl = 'https://eastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US';
  const body = await request.arrayBuffer();
  const response = await fetch(azureUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': azureKey,
      'Content-Type': request.headers.get('Content-Type') || 'audio/webm',
    },
    body: body,
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
