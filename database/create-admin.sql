USE albru;

-- Crear usuario administrador
-- Email: admin@albru.com
-- Password: admin123 (hash bcrypt)
INSERT INTO usuarios (nombre, email, password, telefono, tipo, estado, created_at) 
VALUES (
  'Administrador Sistema', 
  'admin@albru.com', 
  '$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm', 
  '999000000', 
  'admin', 
  'activo', 
  NOW()
);

SELECT 'Usuario admin creado exitosamente' as status;
SELECT id, nombre, email, tipo FROM usuarios WHERE email = 'admin@albru.com';
