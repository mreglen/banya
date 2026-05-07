-- Добавляет реквизиты организации (одна запись).
-- Таблица хранит данные для админки "Компания → Организация"
-- и для вывода в лендинге в блоке "Контакты".

CREATE TABLE IF NOT EXISTS organization_details (
  id INTEGER PRIMARY KEY,
  address TEXT NOT NULL DEFAULT '',
  inn VARCHAR(12) NOT NULL DEFAULT '',
  kpp VARCHAR(9) NOT NULL DEFAULT '',
  requisites TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_details_singleton CHECK (id = 1)
);

INSERT INTO organization_details (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

