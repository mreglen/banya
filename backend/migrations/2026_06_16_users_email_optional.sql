-- Делает email необязательным для сотрудников (users.email)
-- PostgreSQL: UNIQUE допускает несколько NULL-значений.
-- Выполнить на сервере:
--   sudo -u postgres psql -d banya -f backend/migrations/2026_06_16_users_email_optional.sql

BEGIN;

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

COMMIT;
