#!/bin/bash
# Выпуск SSL-сертификата Let's Encrypt для nikolaevskie.ru.
# Не используем certbot --nginx: он переписывает vhost и ломает 410/HTTPS-конфиг.
set -euo pipefail

DOMAIN="nikolaevskie.ru"
EMAIL="${CERTBOT_EMAIL:-nikolaevskiebani@yandex.ru}"

if ! command -v certbot &>/dev/null; then
  apt update
  apt install -y certbot python3-certbot-nginx
fi

if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  echo "==> Выпуск сертификата (certonly, без правки nginx)"
  certbot certonly --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$EMAIL"
else
  echo "==> Сертификат уже есть: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
fi

bash /root/banya/deploy/reload-nginx.sh

echo "SSL готов: https://$DOMAIN"
