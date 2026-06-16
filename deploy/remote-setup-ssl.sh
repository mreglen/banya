#!/bin/bash
# Выпуск SSL-сертификата Let's Encrypt для nikolaevskie.ru
set -euo pipefail

DOMAIN="nikolaevskie.ru"
EMAIL="${CERTBOT_EMAIL:-nikolaevskiebani@yandex.ru}"

if ! command -v certbot &>/dev/null; then
  apt update
  apt install -y certbot python3-certbot-nginx
fi

# Убедимся, что nginx слушает домен на :80
bash /root/banya/deploy/remote-fix-nginx.sh

certbot --nginx \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  -m "$EMAIL" \
  --redirect

nginx -t
systemctl reload nginx

echo "SSL готов: https://$DOMAIN"
