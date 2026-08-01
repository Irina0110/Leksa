/**
 * Cloudflare Worker — прокси Google Translate TTS для iPhone PWA.
 * Без него Safari/PWA не отдаёт audio/mpeg с translate.googleapis.com в <audio>.
 *
 * Деплой: см. README или `npx wrangler deploy` из этой папки.
 */
export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '*'

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    if (request.method !== 'GET') {
      return json(405, { error: 'Method not allowed' }, origin)
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim().slice(0, 180)
    const tl = (url.searchParams.get('tl') || 'en').trim()

    if (!q) return json(400, { error: 'Missing q' }, origin)
    if (!/^[a-z]{2,5}(-[a-zA-Z]{2,5})?$/.test(tl)) {
      return json(400, { error: 'Invalid tl' }, origin)
    }

    const tts = new URL('https://translate.googleapis.com/translate_tts')
    tts.searchParams.set('ie', 'UTF-8')
    tts.searchParams.set('client', 'gtx')
    tts.searchParams.set('tl', tl)
    tts.searchParams.set('q', q)

    try {
      const upstream = await fetch(tts.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          Accept: 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
        },
      })

      if (!upstream.ok) {
        return json(502, { error: `Upstream ${upstream.status}` }, origin)
      }

      const buffer = await upstream.arrayBuffer()
      if (!buffer.byteLength) {
        return json(502, { error: 'Empty audio' }, origin)
      }

      return new Response(buffer, {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch {
      return json(502, { error: 'TTS fetch failed' }, origin)
    }
  },
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
    },
  })
}
