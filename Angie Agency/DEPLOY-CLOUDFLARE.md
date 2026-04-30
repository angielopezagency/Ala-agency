# Deploy en Cloudflare — Guía Paso a Paso

## PASO 1 — Crear cuenta Cloudflare
1. Ve a cloudflare.com → Sign up con tu email
2. Confirma el email

## PASO 2 — Subir la página (Cloudflare Pages)
1. Dashboard → Pages → Create a project → Upload assets
2. Nombre: ala-agency
3. Arrastra la carpeta ala-system completa
4. Deploy → URL: https://ala-agency.pages.dev

## PASO 3 — Worker para IA (proxy de Claude)
1. Workers & Pages → Create → Create Worker
2. Nombre: ala-ai-proxy
3. Edit code → pega el contenido de functions/ai-proxy.js → Deploy
4. Settings → Variables → Add:
   - ANTHROPIC_KEY = (tu API key de Anthropic)
5. Copia tu URL: https://ala-ai-proxy.TU-USUARIO.workers.dev

## PASO 4 — Worker para Emails
1. Create Worker → ala-email-proxy
2. Pega functions/email-proxy.js → Deploy
3. Settings → Variables → Add:
   - RESEND_KEY = re_1Q5Y69fk_PhFt5wxefXmM6d4kD3KQRkth

## PASO 5 — Actualizar URLs en el código
En index.html y admin/dashboard.html busca:
  const AI_PROXY = 'https://ala-ai-proxy.TU-USUARIO.workers.dev';
  const EMAIL_PROXY = 'https://ala-email-proxy.TU-USUARIO.workers.dev';
Reemplaza TU-USUARIO y re-sube a Pages.

## COSTO TOTAL
Cloudflare Pages: GRATIS (sin límites)
Cloudflare Workers: GRATIS (100K req/dia)
Supabase: GRATIS (500MB)
Resend: GRATIS (3K emails/mes)
Claude API: ~$1-2/mes
TOTAL: ~$1-2/mes
