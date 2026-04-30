// ============================================
// ALA AGENCY — CONFIG COMPARTIDO
// assets/ala.js
// ============================================

const ALA = {
  SUPABASE_URL: 'https://mxuoahnnchwxoqcmlira.supabase.co',
  SUPABASE_KEY: 'sb_publishable_mTml2uNpOY9iNy9u-y_BHg_G3cBfuZk',
  ADMIN_EMAIL: 'angie.lpz08@gmail.com',
  WA: '18097071943',

  // Tipos de trabajo
  JOB_TYPES: {
    fotografia: { label: 'Fotografía', icon: '📸', color: '#FF6B8A' },
    redes: { label: 'Redes Sociales', icon: '📱', color: '#7B2FBE' },
    branding: { label: 'Branding', icon: '🏛️', color: '#FF9F1C' },
    video: { label: 'Video', icon: '🎬', color: '#E63E6D' },
    web: { label: 'Web', icon: '🌐', color: '#0095f6' }
  },

  // Estados
  STATUS: {
    pendiente: { label: 'Pendiente', color: '#8B8B96', bg: 'rgba(139,139,150,.15)' },
    en_progreso: { label: 'En Progreso', color: '#FF9F1C', bg: 'rgba(255,159,28,.15)' },
    revision: { label: 'En Revisión', color: '#7B2FBE', bg: 'rgba(123,47,190,.15)' },
    completado: { label: 'Completado', color: '#4ade80', bg: 'rgba(74,222,128,.15)' }
  }
};

// ── Supabase Client (CDN) ──────────────────
// Se carga via <script> en cada página
let _sb = null;
function getSB() {
  if (!_sb) _sb = supabase.createClient(ALA.SUPABASE_URL, ALA.SUPABASE_KEY);
  return _sb;
}

// ── Auth helpers ───────────────────────────
const Auth = {
  // Guardar sesión en sessionStorage
  save(session) {
    sessionStorage.setItem('ala_session', JSON.stringify(session));
  },
  // Obtener sesión actual
  get() {
    try { return JSON.parse(sessionStorage.getItem('ala_session')); }
    catch { return null; }
  },
  // Limpiar
  clear() { sessionStorage.removeItem('ala_session'); },
  // Es admin?
  isAdmin() { return this.get()?.role === 'admin'; },
  // Es cliente?
  isClient() { return this.get()?.role === 'client'; },
  // Requerir login o redirigir
  requireAdmin() {
    if (!this.isAdmin()) { window.location.href = '/admin/login.html'; return false; }
    return true;
  },
  requireClient() {
    if (!this.isClient()) { window.location.href = '/client/login.html'; return false; }
    return true;
  }
};

// ── UI helpers ─────────────────────────────
const UI = {
  // Badge de estado
  statusBadge(status) {
    const s = ALA.STATUS[status] || ALA.STATUS.pendiente;
    return `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:500;font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase">${s.label}</span>`;
  },
  // Progress bar
  progressBar(pct) {
    return `<div style="background:rgba(255,255,255,.08);border-radius:99px;height:6px;overflow:hidden">
      <div style="background:linear-gradient(90deg,#E63E6D,#FF6B8A);height:100%;width:${pct}%;transition:width .4s"></div>
    </div>`;
  },
  // Formatear fecha
  date(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-DO', { day:'numeric', month:'short', year:'numeric' });
  },
  // Días restantes
  daysLeft(deadline) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    return diff;
  },
  // Toast notification
  toast(msg, type='info') {
    const t = document.createElement('div');
    const colors = { info:'#7B2FBE', success:'#4ade80', error:'#FF6B8A', warn:'#FF9F1C' };
    t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:${colors[type]||colors.info};color:#fff;padding:12px 22px;border-radius:8px;font-size:.84rem;font-weight:500;z-index:9999;transition:transform .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.3)`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
    setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(80px)'; setTimeout(() => t.remove(), 300); }, 3000);
  },
  // Loading spinner
  spin(el, on) {
    if (on) { el._orig = el.innerHTML; el.innerHTML = '⟳'; el.disabled = true; el.style.opacity = '.6'; }
    else { el.innerHTML = el._orig || el.innerHTML; el.disabled = false; el.style.opacity = '1'; }
  }
};

// ── File helpers ───────────────────────────
const Files = {
  // Subir archivo a Supabase Storage
  async upload(file, path) {
    const sb = getSB();
    const { data, error } = await sb.storage.from('ala-files').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = sb.storage.from('ala-files').getPublicUrl(path);
    return publicUrl;
  },
  // Formatear tamaño
  size(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  },
  // Icono por extensión
  icon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const map = { jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', webp:'🖼️', pdf:'📄', doc:'📝', docx:'📝', zip:'🗜️', mp4:'🎬', mov:'🎬' };
    return map[ext] || '📎';
  }
};
