#!/bin/bash
set -euo pipefail

cat > /root/banya/backend/.env << 'EOF'
DATABASE_URL=postgresql://user_banya:Vfcnth1!@localhost:5432/banya

SECRET_KEY=supersecretkey1234567890

EMAIL_HOST=mail.nic.ru
EMAIL_PORT=465
EMAIL_HOST_USER=support@svoygarage.ru
EMAIL_HOST_PASSWORD=Vfcnth1!
EMAIL_FROM=support@svoygarage.ru

ALLOWED_ORIGINS=https://nikolaevskie.ru,https://www.nikolaevskie.ru,http://nikolaevskie.ru,http://www.nikolaevskie.ru,http://89.108.88.31
EOF

mkdir -p /root/banya/backend/uploads /root/banya/backend/public/img
