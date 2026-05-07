-- Расширение колонок для предотвращения 500 при слишком длинных значениях.
-- Нормальные форматы: ИНН = 10 или 12 цифр, КПП = 9 цифр.

ALTER TABLE organization_details
  ALTER COLUMN inn TYPE TEXT,
  ALTER COLUMN kpp TYPE TEXT;

