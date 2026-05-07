-- Unified RBAC migration for roles and permissions.
-- 1) create role_permissions
-- 2) backfill from user_permissions
-- 3) seed required permissions
-- 4) optional cleanup of user_permissions

-- 1) Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
    ON role_permissions (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
    ON role_permissions (permission_id);

-- 2) Backfill role permissions from existing user_permissions.
-- If many users share one role, rights are unioned.
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT u.role_id, up.permission_id
FROM users u
JOIN user_permissions up ON up.user_id = u.user_id
WHERE u.role_id IS NOT NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3) Ensure required permissions for reservations/admin sections exist.
INSERT INTO permissions (code, name, category, description)
VALUES
    ('administrator:view', 'Доступ к панели администратора', 'administrator', 'Открытие админ-хаба'),
    ('administrator:roles', 'Управление ролями', 'administrator', 'Просмотр и редактирование ролей'),
    ('administrator:audit', 'Просмотр журнала аудита', 'administrator', 'Доступ к журналу аудита'),
    ('reservations:view', 'Просмотр бронирований', 'reservations', 'Просмотр списка и деталей бронирований'),
    ('reservations:manage', 'Управление бронированиями', 'reservations', 'Создание, редактирование и удаление бронирований')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- Optional seed: attach new permissions to admin-like roles by name.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE LOWER(r.name) IN ('администратор', 'administrator', 'директор', 'director')
  AND p.code IN (
      'administrator:view',
      'administrator:roles',
      'administrator:audit',
      'reservations:view',
      'reservations:manage'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4) Optional cleanup (run only after full code switch)
-- DROP TABLE IF EXISTS user_permissions;
