CREATE TABLE IF NOT EXISTS payment_qr_setting (
    id INTEGER PRIMARY KEY DEFAULT 1,
    image_url VARCHAR(500),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by_user_id INTEGER REFERENCES users(user_id)
);

INSERT INTO payment_qr_setting (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM payment_qr_setting WHERE id = 1);
