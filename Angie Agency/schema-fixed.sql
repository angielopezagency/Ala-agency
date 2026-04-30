-- ALA AGENCY — SCHEMA FIXED v2

-- TABLAS
create table if not exists clients (id uuid primary key default gen_random_uuid(), email text unique not null, name text not null, phone text, business text, created_at timestamptz default now());
create table if not exists jobs (id uuid primary key default gen_random_uuid(), client_id uuid references clients(id) on delete cascade, title text not null, type text not null, status text default 'pendiente', progress int default 0, deadline timestamptz, notes text, price numeric(10,2), paid boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists files (id uuid primary key default gen_random_uuid(), job_id uuid references jobs(id) on delete cascade, client_id uuid references clients(id) on delete cascade, name text not null, url text not null, size int, type text, uploaded_by text, created_at timestamptz default now());
create table if not exists messages (id uuid primary key default gen_random_uuid(), job_id uuid references jobs(id) on delete cascade, client_id uuid references clients(id) on delete cascade, sender text not null, body text not null, read boolean default false, created_at timestamptz default now());
create table if not exists payments (id uuid primary key default gen_random_uuid(), job_id uuid references jobs(id) on delete cascade, client_id uuid references clients(id) on delete cascade, amount numeric(10,2) not null, currency text default 'USD', method text, status text default 'pendiente', reference text, date timestamptz default now(), notes text);
create table if not exists access_tokens (id uuid primary key default gen_random_uuid(), client_id uuid references clients(id) on delete cascade, token text unique not null default encode(gen_random_bytes(32),'hex'), expires_at timestamptz default now() + interval '7 days', used boolean default false, created_at timestamptz default now());

-- AGREGAR expires_at A files SI NO EXISTE
alter table files add column if not exists expires_at timestamptz;

-- RLS
alter table clients enable row level security;
alter table jobs enable row level security;
alter table files enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;
alter table access_tokens enable row level security;

-- POLÍTICAS (drop + create para evitar duplicados)
do $$ begin
  drop policy if exists "allow_all_anon" on clients;
  drop policy if exists "allow_all_anon" on jobs;
  drop policy if exists "allow_all_anon" on files;
  drop policy if exists "allow_all_anon" on messages;
  drop policy if exists "allow_all_anon" on payments;
  drop policy if exists "allow_all_anon" on access_tokens;
exception when others then null;
end $$;

create policy "allow_all_anon" on clients for all using (true) with check (true);
create policy "allow_all_anon" on jobs for all using (true) with check (true);
create policy "allow_all_anon" on files for all using (true) with check (true);
create policy "allow_all_anon" on messages for all using (true) with check (true);
create policy "allow_all_anon" on payments for all using (true) with check (true);
create policy "allow_all_anon" on access_tokens for all using (true) with check (true);

-- STORAGE
insert into storage.buckets (id, name, public) values ('ala-files', 'ala-files', false) on conflict (id) do nothing;
drop policy if exists "authenticated_upload" on storage.objects;
create policy "authenticated_upload" on storage.objects for all using (bucket_id = 'ala-files') with check (bucket_id = 'ala-files');

-- TRIGGER: auto-expirar archivos de clientes a 15 días
create or replace function set_file_expiry() returns trigger as $$
begin
  if new.uploaded_by in ('client','admin') and new.type in ('upload_client','entregable') then
    new.expires_at := now() + interval '15 days';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists auto_expire_files on files;
create trigger auto_expire_files before insert on files for each row execute function set_file_expiry();

-- FUNCIÓN: limpiar expirados
create or replace function delete_expired_files() returns void as $$
begin
  delete from files where expires_at is not null and expires_at < now() and type in ('upload_client','entregable');
end;
$$ language plpgsql;

-- VISTA: días restantes (ahora que expires_at existe)
drop view if exists client_files_with_expiry;
create view client_files_with_expiry as
select f.*,
  greatest(0, extract(day from (f.expires_at - now()))::int) as days_remaining,
  case when f.expires_at is not null and f.expires_at < now() + interval '3 days' then true else false end as expiring_soon
from files f
where f.expires_at is not null;

-- ACTIVAR LIMPIEZA DIARIA (ejecutar después de activar pg_cron en Extensions):
-- SELECT cron.schedule('cleanup-files', '0 3 * * *', 'SELECT delete_expired_files()');
