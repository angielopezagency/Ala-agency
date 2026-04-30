exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { type, to, data } = JSON.parse(event.body || '{}');
    let subject, html;

    if (type === 'admin_recovery') {
      subject = '🔑 Tu nueva clave — Angie Lopez Agency';
      html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#1a1a24;color:white;border-radius:12px">
        <h2 style="color:#FF6B8A;margin:0 0 20px">🔑 Clave temporal de acceso</h2>
        <div style="background:rgba(255,107,138,.15);border:2px solid #FF6B8A;border-radius:10px;padding:24px;text-align:center;margin:20px 0">
          <div style="color:#FF9F1C;font-family:monospace;font-size:2.2rem;font-weight:700;letter-spacing:4px">${data.tempPass}</div>
          <p style="color:rgba(255,255,255,.5);font-size:13px;margin:10px 0 0">Válida por 1 hora únicamente</p>
        </div>
        <a href="${data.panelUrl}" style="display:block;background:linear-gradient(90deg,#E63E6D,#FF6B8A);color:white;text-decoration:none;padding:15px;border-radius:8px;text-align:center;font-weight:600;font-size:16px">Ir al Panel de Admin →</a>
        <p style="color:rgba(255,255,255,.4);font-size:12px;text-align:center;margin-top:15px">Si no solicitaste esto, ignora este email.</p>
      </div>`;
    } else if (type === 'welcome_client') {
      subject = '👋 Tu portal está listo — Angie Lopez Agency';
      html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#1a1a24;color:white;border-radius:12px">
        <h2 style="color:#FF6B8A;margin:0 0 15px">¡Bienvenido/a, ${data.clientName}! 👋</h2>
        <p style="color:rgba(255,255,255,.7);line-height:1.6">Tu portal personal de Angie Lopez Agency está listo. Desde aquí puedes ver el progreso de tus proyectos, subir fotos y descargar tus entregables.</p>
        <a href="${data.portalUrl}" style="display:block;background:linear-gradient(90deg,#E63E6D,#FF6B8A);color:white;text-decoration:none;padding:15px;border-radius:8px;text-align:center;font-weight:600;font-size:16px;margin-top:20px">🚀 Entrar a Mi Portal →</a>
        <p style="color:rgba(255,255,255,.4);font-size:12px;text-align:center;margin-top:15px">Enlace válido por 7 días · <a href="https://wa.me/18097071943" style="color:#FF6B8A">¿Ayuda? WhatsApp</a></p>
      </div>`;
    } else if (type === 'entregable_ready') {
      subject = `📥 Tus archivos están listos — ${data.jobTitle}`;
      html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#1a1a24;color:white;border-radius:12px">
        <h2 style="color:#FF6B8A;margin:0 0 15px">📥 ¡Tus archivos están listos!</h2>
        <p style="color:rgba(255,255,255,.7);line-height:1.6">Hola <strong>${data.clientName}</strong>, Angie terminó tu proyecto <strong style="color:#FF9F1C">${data.jobTitle}</strong>. Tus archivos editados están listos para descargar.</p>
        <div style="background:rgba(255,159,28,.12);border:1px solid rgba(255,159,28,.4);border-radius:8px;padding:12px;margin:15px 0;color:#FF9F1C;font-size:14px">⏳ Recuerda: tienes <strong>15 días</strong> para descargarlos antes de que expiren.</div>
        <a href="${data.portalUrl}" style="display:block;background:linear-gradient(90deg,#E63E6D,#FF6B8A);color:white;text-decoration:none;padding:15px;border-radius:8px;text-align:center;font-weight:600;font-size:16px">Descargar mis archivos →</a>
      </div>`;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'ALA Agency <onboarding@resend.dev>',
        to: [to],
        subject,
        html
      })
    });

    const result = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
