-- Crea un usuario admin (reemplaza email y contraseña)
-- 1. Inserta el usuario (contraseña hasheada de "admin123")
INSERT INTO users (id, email, password, "isActive", "isEmailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'admin@securecustodian.app', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmF0xPZwPybzR3qGQOCe', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Asigna rol admin al usuario
INSERT INTO user_role (id, "userId", "roleId")
SELECT gen_random_uuid()::text, u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@securecustodian.app'
AND r.name = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_role ur WHERE ur."userId" = u.id AND ur."roleId" = r.id
);
