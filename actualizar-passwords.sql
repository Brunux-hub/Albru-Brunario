USE albru;

-- Actualizar contraseñas con hashes correctos
UPDATE usuarios_sistema SET password_hash = '$2b$10$eeIvlmdq17IM/ZXQEuSYLee02Nex8Khj5tUWQtlp0AuOCHjpDuRhm' WHERE username = 'admin';
UPDATE usuarios_sistema SET password_hash = '$2b$10$iXSh16FjKfDvHp9BF7Axn.Qv3ItsLyzjkbQbJk6AO/9RCTiOCKese' WHERE username = 'gtr_maria';
UPDATE usuarios_sistema SET password_hash = '$2b$10$P9BjbQ2iGjXXwRGlshlJZ.YFU9/pVwpHXG3wL3JVITtUAC7dejbVi' WHERE username = 'asesor_carlos';

-- Verificar actualizaciones
SELECT username, LEFT(password_hash, 30) as hash_inicio FROM usuarios_sistema;