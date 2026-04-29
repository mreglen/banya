-- Миграция: Добавление поля slug в таблицу baths
-- Выполнить этот SQL скрипт для добавления и заполнения поля slug

-- Шаг 1: Добавляем колонку slug
ALTER TABLE baths ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

-- Шаг 2: Генерируем slug для существующих бань
-- Используем простой подход - slug на основе ID
UPDATE baths SET slug = 'bath-' || bath_id WHERE slug IS NULL;

-- Шаг 3: Если хотите транслитерацию, обновите вручную для каждой бани:
-- UPDATE baths SET slug = 'kedrovaya-banya' WHERE bath_id = 1;
-- UPDATE baths SET slug = 'lipovaya-banya' WHERE bath_id = 2;
-- UPDATE baths SET slug = 'neftitovaya-banya' WHERE bath_id = 3;

-- Шаг 4: Убедимся что все slug заполнены
UPDATE baths SET slug = 'bath-' || bath_id WHERE slug IS NULL OR slug = '';

-- Шаг 5: Добавляем ограничения
ALTER TABLE baths ALTER COLUMN slug SET NOT NULL;
ALTER TABLE baths ADD CONSTRAINT baths_slug_key UNIQUE (slug);
CREATE INDEX idx_baths_slug ON baths(slug);
