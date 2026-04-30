# ALA AGENCY SYSTEM — Setup Guide
## Pasos para activar el sistema completo

### PASO 1: Supabase — Crear la base de datos
1. Ve a https://mxuoahnnchwxoqcmlira.supabase.co
2. Ir a **SQL Editor** → **New Query**
3. Pegar TODO el contenido de `schema.sql`
4. Clic en **Run**
5. Ir a **Storage** → **New Bucket** → nombre: `ala-files` → Public: **OFF** → Crear

### PASO 2: Cambiar la clave de admin
En `admin/dashboard.html` busca esta línea:
```js
const ADMIN_PASS = 'ala2025admin';
```
Cámbiala por una clave que solo tú sepas.

### PASO 3: Deploy en Netlify
1. Ve a https://netlify.com → **Add new site** → **Deploy manually**
2. Arrastra la carpeta `ala-system` completa
3. Tu sistema estará en algo como `https://ala-agency.netlify.app`

### PASO 4: Usar el sistema

**Como Admin (Angie):**
- Ir a `tudominio.com/admin/dashboard.html`
- Ingresar con tu clave
- Crear cliente → Sistema genera link automático
- Enviar link al cliente por WhatsApp

**Como Cliente:**
- Recibe el link único (ej: `tudominio.com/client/portal.html?token=abc123`)
- Sin contraseña — acceso directo por 7 días
- Puede subir fotos, ver estado, chatear con Angie

### ESTRUCTURA DE ARCHIVOS
```
ala-system/
├── index.html              ← Página pública
├── schema.sql              ← Ejecutar en Supabase
├── assets/
│   ├── ala.css            ← Estilos compartidos
│   └── ala.js             ← Config + helpers
├── admin/
│   └── dashboard.html     ← Panel de Angie
└── client/
    └── portal.html        ← Portal del cliente
```

### PRÓXIMAS FASES
- Fase 3: Notificaciones por email (Resend.com — gratis)
- Fase 4: Pagos con Stripe o transferencias
- Fase 5: IA creativa avanzada con generación de imágenes
- Fase 6: App móvil progresiva (PWA)

### COSTO TOTAL DEL SISTEMA
- Supabase: GRATIS (hasta 500MB DB + 1GB storage)
- Netlify: GRATIS (hasta 100GB/mes)
- Claude API (IA Creativa): ~$0.25-1.00/mes uso normal
- TOTAL: ~$1-3/mes en uso real
