#!/bin/bash
set -euo pipefail

# Sync static images into backend public (for direct API access)
mkdir -p /root/banya/backend/public/img
rsync -a /root/banya/frontend/my-banya/public/img/ /root/banya/backend/public/img/

# Republish frontend build
mkdir -p /var/www/banya
rsync -a --delete /root/banya/frontend/my-banya/build/ /var/www/banya/

bash /root/banya/deploy/remote-fix-nginx.sh
systemctl restart banya-backend

echo "=== verify images ==="
curl -s -o /dev/null -w "logo: %{http_code}\n" -H "Host: nikolaevskie.ru" http://127.0.0.1/img/Logo.png
curl -s -o /dev/null -w "bg: %{http_code}\n" -H "Host: nikolaevskie.ru" http://127.0.0.1/img/bg-home.png
