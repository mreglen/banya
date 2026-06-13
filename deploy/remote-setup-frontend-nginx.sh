#!/bin/bash
set -euo pipefail

cd /root/banya/frontend/my-banya
echo 'REACT_APP_API_URL=/api' > .env
npm install
npm run build

bash /root/banya/deploy/remote-fix-nginx.sh

cp /root/banya/deploy/banya-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable banya-backend
systemctl restart banya-backend
