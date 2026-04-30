-- ============================================
-- ALA AGENCY — AUTO-DELETE CLIENT FILES (15 días)
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- 1. Agregar campo expires_at a files para clientes
ALTER TABLE files ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Trigger: cuando un cliente sube o recibe un archivo, 
--    asignar expiración de 15 días automáticamente
CREATE OR REPLACE FUNCTION set_file_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo archivos del dashboard del cliente (no los de admin/internos)
  IF NEW.uploaded_by IN ('client', 'admin') AND NEW.type IN ('upload_client', 'entregable') THEN
    NEW.expires_at := NOW() + INTERVAL '15 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_expire_files ON files;
CREATE TRIGGER auto_expire_files
  BEFORE INSERT ON files
  FOR EACH ROW EXECUTE FUNCTION set_file_expiry();

-- 3. Función que elimina archivos expirados (se llama con pg_cron)
CREATE OR REPLACE FUNCTION delete_expired_files()
RETURNS void AS $$
DECLARE
  file_record RECORD;
BEGIN
  FOR file_record IN 
    SELECT id, url, name FROM files 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND type IN ('upload_client', 'entregable')
  LOOP
    -- Eliminar registro de la DB
    DELETE FROM files WHERE id = file_record.id;
    -- Nota: el archivo en Storage se limpia por separado (ver instrucciones)
    RAISE NOTICE 'Deleted expired file: %', file_record.name;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Programar limpieza diaria a las 3am (requiere extensión pg_cron en Supabase)
-- Ir a Database > Extensions > activar pg_cron, luego ejecutar:
SELECT cron.schedule(
  'delete-expired-client-files',
  '0 3 * * *',  -- Todos los días a las 3:00 AM
  'SELECT delete_expired_files()'
);

-- 5. Vista para que el dashboard muestre archivos con días restantes
CREATE OR REPLACE VIEW client_files_with_expiry AS
SELECT 
  f.*,
  CASE 
    WHEN f.expires_at IS NULL THEN NULL
    ELSE GREATEST(0, EXTRACT(DAY FROM (f.expires_at - NOW()))::INT)
  END AS days_remaining,
  CASE
    WHEN f.expires_at IS NOT NULL AND f.expires_at < NOW() + INTERVAL '3 days' THEN true
    ELSE false
  END AS expiring_soon
FROM files f
WHERE f.expires_at IS NOT NULL;

-- ============================================
-- INSTRUCCIONES ADICIONALES
-- ============================================
-- Para limpiar archivos del STORAGE también:
-- 1. Ve a Supabase > Edge Functions > Create Function
-- 2. Nombre: "cleanup-expired-files"
-- 3. Código de la función está en functions/cleanup.js
-- 4. Activar en Database > Webhooks o llamar desde pg_cron

-- VERIFICAR qué archivos expirarán pronto:
-- SELECT name, client_id, expires_at, days_remaining 
-- FROM client_files_with_expiry 
-- WHERE days_remaining <= 3 
-- ORDER BY days_remaining;
