-- ============================================
-- ANGIE LOPEZ AGENCY — DATABASE SCHEMA
-- Ejecutar en Supabase > SQL Editor > Run
-- ============================================

-- CLIENTES
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text,
  business text,
  created_at timestamptz default now()
);

-- TRABAJOS / PROYECTOS
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  type text not null, -- 'fotografia','redes','branding','video','web'
  status text default 'pendiente', -- 'pendiente','en_progreso','revision','completado'
  progress int default 0, -- 0-100
  deadline timestamptz,
  notes text,
  price numeric(10,2),
  paid boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ARCHIVOS (fotos subidas por cliente + entregables de Angie)
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  url text not null,
  size int,
  type text, -- 'upload_client','entregable','documento'
  uploaded_by text, -- 'client' o 'admin'
  created_at timestamptz default now()
);

-- MENSAJES (chat interno por trabajo)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  sender text not null, -- 'client' o 'admin'
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- PAGOS
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text default 'USD',
  method text, -- 'transferencia','efectivo','tarjeta'
  status text default 'pendiente', -- 'pendiente','confirmado'
  reference text,
  date timestamptz default now(),
  notes text
);

-- TOKENS DE ACCESO PARA CLIENTES (magic link simple)
create table if not exists access_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(32),'hex'),
  expires_at timestamptz default now() + interval '7 days',
  used boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (básico)
-- ============================================
alter table clients enable row level security;
alter table jobs enable row level security;
alter table files enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;
alter table access_tokens enable row level security;

-- Política: acceso total con service role (para funciones de backend)
-- El frontend usa anon key solo para leer con token válido

-- Para desarrollo: permitir todo con anon (ajustar en producción)
create policy "allow_all_anon" on clients for all using (true) with check (true);
create policy "allow_all_anon" on jobs for all using (true) with check (true);
create policy "allow_all_anon" on files for all using (true) with check (true);
create policy "allow_all_anon" on messages for all using (true) with check (true);
create policy "allow_all_anon" on payments for all using (true) with check (true);
create policy "allow_all_anon" on access_tokens for all using (true) with check (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Ir a Storage > New bucket > nombre: "ala-files" > Public: NO
-- Luego ejecutar:
insert into storage.buckets (id, name, public) 
values ('ala-files', 'ala-files', false)
on conflict (id) do nothing;

-- Política de storage
create policy "authenticated_upload" on storage.objects
  for all using (bucket_id = 'ala-files') with check (bucket_id = 'ala-files');

-- ============================================
-- DATOS DE PRUEBA (opcional)
-- ============================================
-- Cliente de prueba
insert into clients (email, name, phone, business) values
('cliente@ejemplo.com', 'María Rodríguez', '+1 809 555-0001', 'Restaurante Piantini')
on conflict (email) do nothing;
