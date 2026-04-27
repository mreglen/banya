-- Миграция: Добавление детальных полей в журнал аудита
-- Дата: 2026-04-27
-- Описание: Добавление полей для хранения человеко-читаемого описания действий

ALTER TABLE audit_logs 
ADD COLUMN summary TEXT,
ADD COLUMN bath_name VARCHAR(100),
ADD COLUMN client_name VARCHAR(100),
ADD COLUMN event_datetime TIMESTAMP,
ADD COLUMN product_list TEXT;

-- Создание индексов для улучшения производительности поиска
CREATE INDEX idx_audit_summary ON audit_logs(summary);
CREATE INDEX idx_audit_bath ON audit_logs(bath_name);
CREATE INDEX idx_audit_client ON audit_logs(client_name);
CREATE INDEX idx_audit_event_datetime ON audit_logs(event_datetime);
