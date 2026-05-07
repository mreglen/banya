BEGIN;

ALTER TABLE baths
ADD COLUMN IF NOT EXISTS min_booking_hours INTEGER;

UPDATE baths
SET min_booking_hours = 1
WHERE min_booking_hours IS NULL OR min_booking_hours < 1;

ALTER TABLE baths
ALTER COLUMN min_booking_hours SET NOT NULL,
ALTER COLUMN min_booking_hours SET DEFAULT 1;

ALTER TABLE baths
DROP CONSTRAINT IF EXISTS baths_min_booking_hours_check;

ALTER TABLE baths
ADD CONSTRAINT baths_min_booking_hours_check
CHECK (min_booking_hours >= 1);

COMMIT;
