// ============================================
// CLOUDFLARE WORKER — ALA Email Proxy
// Nombre sugerido: ala-email-proxy
// ============================================
// Envía emails vía Resend desde el Worker.
// Úsalo para: notificaciones a clientes, recuperación de clave.

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
      const { type, to, data } = await request.json();

      let emailPayload;

      // ── TIPO: Entregable listo ───────────────────────
      if (type === 'entregable_ready') {
        emailPayload = {
          from: 'Angie Lopez Agency <notificaciones@angielopezagency.com>',
          to: [to],
          subject: `📥 Tus entregables están listos — ${data.jobTitle}`,
          html: emailEntregable(data)
        };
      }

      // ── TIPO: Recuperar clave admin ──────────────────
      else if (type === 'admin_recovery') {
        emailPayload = {
          from: 'ALA Agency <onboarding@resend.dev>',
          to: [to],
          subject: '🔑 Tu nueva clave de acceso — Angie Lopez Agency',
          html: emailRecovery(data)
        };
      }

      // ── TIPO: Nuevo mensaje de Angie ─────────────────
      else if (type === 'new_message') {
        emailPayload = {
          from: 'Angie Lopez Agency <notificaciones@angielopezagency.com>',
          to: [to],
          subject: `💬 Angie te dejó un mensaje — ${data.jobTitle}`,
          html: emailNewMessage(data)
        };
      }

      // ── TIPO: Bienvenida nuevo cliente ───────────────
      else if (type === 'welcome_client') {
        emailPayload = {
          from: 'Angie Lopez Agency <bienvenida@angielopezagency.com>',
          to: [to],
          subject: '👋 Bienvenido/a a Angie Lopez Agency — Tu portal está listo',
          html: emailWelcome(data)
        };
      }

      else {
        return new Response(JSON.stringify({ error: 'Unknown email type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_KEY}`
        },
        body: JSON.stringify(emailPayload)
      });

      const result = await res.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// ── EMAIL TEMPLATES ────────────────────────────────────

function baseWrapper(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F0F14;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#1A1A24;border:1px solid rgba(255,107,138,.2);border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#C4305A,#FF6B8A);padding:22px 28px;display:flex;align-items:center;gap:12px">
    <div style="color:white;font-size:1.3rem;font-weight:700;font-family:Georgia,serif">Angie Lopez Agency</div>
  </div>
  <div style="padding:28px">${content}</div>
  <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,.06);text-align:center">
    <p style="color:rgba(255,255,255,.35);font-size:.72rem;margin:0">© 2025 Angie Lopez Agency · Santo Domingo, RD · <a href="https://wa.me/18097071943" style="color:#FF6B8A;text-decoration:none">WhatsApp</a></p>
  </div>
</div>
</body></html>`;
}

function btn(url, text) {
  return `<a href="${url}" style="display:block;background:linear-gradient(90deg,#E63E6D,#FF6B8A);color:white;text-decoration:none;padding:14px;border-radius:8px;text-align:center;font-weight:500;font-size:.9rem;margin-top:20px">${text}</a>`;
}

function emailEntregable(d) {
  return baseWrapper(`
    <h2 style="color:white;font-family:Georgia,serif;font-size:1.2rem;margin:0 0 8px">📥 ¡Tus entregables están listos!</h2>
    <p style="color:rgba(255,255,255,.6);font-size:.88rem;line-height:1.65;margin:0 0 20px">Hola <strong style="color:white">${d.clientName}</strong>, Angie terminó de trabajar en <strong style="color:#FF9F1C">${d.jobTitle}</strong> y tus archivos ya están disponibles en tu portal.</p>
    <div style="background:rgba(255,107,138,.08);border:1px solid rgba(255,107,138,.2);border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:rgba(255,255,255,.5);font-size:.76rem;margin:0 0 6px;text-transform:uppercase;letter-spacing:.1em">Archivos subidos</p>
      <p style="color:white;font-size:.92rem;font-weight:500;margin:0">${d.fileCount} archivo(s) listos para descargar</p>
    </div>
    <div style="background:rgba(255,159,28,.08);border:1px solid rgba(255,159,28,.2);border-radius:8px;padding:12px;margin-bottom:20px">
      <p style="color:#FF9F1C;font-size:.76rem;margin:0">⏳ Recuerda: tus archivos estarán disponibles por <strong>15 días</strong>. Descárgalos antes de que venzan.</p>
    </div>
    ${btn(d.portalUrl, '📥 Ir a Mi Portal y Descargar')}
    <p style="color:rgba(255,255,255,.4);font-size:.76rem;text-align:center;margin-top:16px">¿Tienes alguna pregunta? <a href="https://wa.me/18097071943" style="color:#FF6B8A">Escríbele a Angie por WhatsApp</a></p>
  `);
}

function emailRecovery(d) {
  return baseWrapper(`
    <h2 style="color:white;font-family:Georgia,serif;font-size:1.2rem;margin:0 0 8px">🔑 Tu nueva clave temporal</h2>
    <p style="color:rgba(255,255,255,.6);font-size:.88rem;line-height:1.65;margin:0 0 20px">Recibiste una solicitud de recuperación de clave para el panel de administración de Angie Lopez Agency.</p>
    <div style="background:rgba(255,107,138,.1);border:2px solid rgba(255,107,138,.3);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
      <p style="color:rgba(255,255,255,.5);font-size:.72rem;margin:0 0 8px;text-transform:uppercase;letter-spacing:.1em">Tu clave temporal</p>
      <div style="color:#FF9F1C;font-family:'Courier New',monospace;font-size:1.8rem;font-weight:700;letter-spacing:.15em">${d.tempPass}</div>
      <p style="color:rgba(255,255,255,.4);font-size:.72rem;margin:8px 0 0">Válida por 1 hora · Cámbiala después de entrar</p>
    </div>
    ${btn(d.panelUrl, 'Ir al Panel de Admin →')}
    <p style="color:rgba(255,255,255,.35);font-size:.74rem;text-align:center;margin-top:16px">Si no solicitaste este email, ignóralo. Nadie más puede usarla.</p>
  `);
}

function emailNewMessage(d) {
  return baseWrapper(`
    <h2 style="color:white;font-family:Georgia,serif;font-size:1.2rem;margin:0 0 8px">💬 Angie te dejó un mensaje</h2>
    <p style="color:rgba(255,255,255,.6);font-size:.88rem;line-height:1.65;margin:0 0 16px">Hola <strong style="color:white">${d.clientName}</strong>, tienes un nuevo mensaje sobre <strong style="color:#FF9F1C">${d.jobTitle}</strong>:</p>
    <div style="background:rgba(255,255,255,.04);border-left:3px solid #FF6B8A;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px">
      <p style="color:rgba(255,255,255,.85);font-size:.9rem;line-height:1.6;margin:0;font-style:italic">"${d.messagePreview}"</p>
    </div>
    ${btn(d.portalUrl, '💬 Ver Mensaje y Responder')}
    <p style="color:rgba(255,255,255,.4);font-size:.76rem;text-align:center;margin-top:16px">También puedes responder directo por <a href="https://wa.me/18097071943" style="color:#FF6B8A">WhatsApp</a></p>
  `);
}

function emailWelcome(d) {
  return baseWrapper(`
    <h2 style="color:white;font-family:Georgia,serif;font-size:1.2rem;margin:0 0 8px">¡Bienvenido/a, ${d.clientName}! 👋</h2>
    <p style="color:rgba(255,255,255,.6);font-size:.88rem;line-height:1.65;margin:0 0 20px">Estamos muy emocionadas de trabajar contigo. Tu portal personal está listo — desde aquí podrás ver el progreso de tus proyectos, subir fotos y descargar tus entregables.</p>
    <div style="background:rgba(255,107,138,.08);border:1px solid rgba(255,107,138,.2);border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:rgba(255,255,255,.5);font-size:.76rem;margin:0 0 10px;text-transform:uppercase;letter-spacing:.1em">En tu portal puedes</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="color:rgba(255,255,255,.8);font-size:.86rem">📋 Ver el estado y progreso de tus trabajos</div>
        <div style="color:rgba(255,255,255,.8);font-size:.86rem">📤 Subir fotos para edición profesional</div>
        <div style="color:rgba(255,255,255,.8);font-size:.86rem">📥 Descargar tus entregables editados</div>
        <div style="color:rgba(255,255,255,.8);font-size:.86rem">💬 Enviarle mensajes directamente a Angie</div>
      </div>
    </div>
    <div style="background:rgba(255,159,28,.08);border:1px solid rgba(255,159,28,.2);border-radius:8px;padding:12px;margin-bottom:20px">
      <p style="color:#FF9F1C;font-size:.78rem;margin:0">⏳ <strong>Nota:</strong> Los archivos y entregables se conservan por <strong>15 días</strong> en tu portal. Descárgalos antes de que venzan.</p>
    </div>
    ${btn(d.portalUrl, '🚀 Entrar a Mi Portal →')}
    <p style="color:rgba(255,255,255,.4);font-size:.76rem;text-align:center;margin-top:16px">Este enlace es personal y válido por 7 días. <a href="https://wa.me/18097071943" style="color:#FF6B8A">¿Necesitas ayuda? WhatsApp</a></p>
  `);
}
