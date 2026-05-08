-- Add income account to reservations for finance posting

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS income_account_id INTEGER NULL
    REFERENCES organization_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_income_account_id
    ON reservations (income_account_id);

-- Backfill: if exactly one active account exists, use it as default
DO $$
DECLARE
    active_account_id INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*), MIN(id)
    INTO active_count, active_account_id
    FROM organization_accounts
    WHERE is_active = TRUE;

    IF active_count = 1 THEN
        UPDATE reservations
        SET income_account_id = active_account_id
        WHERE income_account_id IS NULL;
    END IF;
END $$;
