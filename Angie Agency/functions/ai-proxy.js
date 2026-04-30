// ============================================
// CLOUDFLARE WORKER — ALA Agency AI Proxy
// Despliega en: workers.cloudflare.com
// Nombre sugerido: ala-ai-proxy
// ============================================
// Este worker recibe mensajes del chat de la web,
// los envía a Claude API y devuelve la respuesta.
// La API key de Anthropic vive aquí, nunca en el frontend.

export default {
  async fetch(request, env) {

    // CORS — permitir desde tu dominio
    const allowedOrigins = [
      'https://ala-agency.pages.dev',
      'https://angielopezagency.com',
      'http://localhost',
      'http://127.0.0.1',
      'null' // file:// para desarrollo local
    ];

    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // En producción cambiar por corsOrigin
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      const { messages, system, max_tokens = 700, model = 'claude-sonnet-4-20250514' } = body;

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid messages' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Llamada a Claude API — la key está en env vars de Cloudflare (segura)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_KEY, // Variable de entorno en Cloudflare
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model, max_tokens, system, messages })
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
