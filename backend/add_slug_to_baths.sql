-- Миграция: Добавление поля slug в таблицу baths
-- Выполнить этот SQL скрипт для добавления и заполнения поля slug

-- Шаг 1: Добавляем колонку slug
ALTER TABLE baths ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

-- Шаг 2: Генерируем slug для существующих бань
-- Простая транслитерация (можно улучшить при необходимости)
UPDATE baths SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(
                                      REPLACE(
                                        REPLACE(
                                          REPLACE(
                                            REPLACE(name,
                                            'а', 'a'),
                                          'б', 'b'),
                                        'в', 'v'),
                                      'г', 'g'),
                                    'д', 'd'),
                                  'е', 'e'),
                                'ё', 'yo'),
                              'ж', 'zh'),
                            'з', 'z'),
                          'и', 'i'),
                        'й', 'y'),
                      'к', 'k'),
                    'л', 'l'),
                  'м', 'm'),
                'н', 'n'),
              'о', 'o'),
            'п', 'p'),
          'р', 'r'),
        'с', 's'),
      'т', 't'),
    'у', 'u'),
  'ф', 'f'),
'х', 'kh'),
'ц', 'ts'),
'ч', 'ch'),
'ш', 'sh'),
'щ', 'shch'),
'ъ', ''),
'ы', 'y'),
'ь', ''),
'э', 'e'),
'ю', 'yu'),
'я', 'ya')
);

-- Заменяем пробелы на дефисы
UPDATE baths SET slug = REPLACE(slug, ' ', '-');

-- Удаляем спецсимволы
UPDATE baths SET slug = REGEXP_REPLACE(slug, '[^a-z0-9-]', '', 'g');

-- Убираем множественные дефисы
UPDATE baths SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g');

-- Убираем дефисы в начале и конце
UPDATE baths SET slug = TRIM(BOTH '-' FROM slug);

-- Для записей где slug пустой или NULL, используем fallback
UPDATE baths SET slug = 'bath-' || bath_id WHERE slug IS NULL OR slug = '';

-- Шаг 3: Делаем slug уникальным (добавляем суффикс для дубликатов)
-- Этот шаг может потребовать ручной проверки если есть дубликаты
-- Для PostgreSQL можно использовать:
WITH duplicates AS (
  SELECT bath_id, slug,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY bath_id) as rn
  FROM baths
)
UPDATE baths SET slug = slug || '-' || duplicates.rn
FROM duplicates
WHERE baths.bath_id = duplicates.bath_id AND duplicates.rn > 1;

-- Шаг 4: Добавляем ограничения
ALTER TABLE baths ALTER COLUMN slug SET NOT NULL;
ALTER TABLE baths ADD CONSTRAINT baths_slug_key UNIQUE (slug);
CREATE INDEX idx_baths_slug ON baths(slug);
