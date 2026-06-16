-- Предоплата по брони (в рублях)
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS prepayment INTEGER NOT NULL DEFAULT 0;
