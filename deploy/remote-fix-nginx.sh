#!/bin/bash
set -euo pipefail

# Nginx (www-data) cannot read files under /root — publish build to /var/www
mkdir -p /var/www/banya /root/banya/backend/public/img
rsync -a /root/banya/frontend/my-banya/public/img/ /root/banya/backend/public/img/
if [[ -d /root/banya/frontend/my-banya/build ]]; then
  rsync -a --delete /root/banya/frontend/my-banya/build/ /var/www/banya/
fi

if [[ -f /etc/letsencrypt/live/nikolaevskie.ru/fullchain.pem ]]; then
  echo "SSL уже настроен — не перезаписываем nginx-конфиг целиком."
else
  cp /root/banya/deploy/nginx-banya.conf /etc/nginx/sites-available/banya
  rm -f /etc/nginx/sites-enabled/default
  ln -sf /etc/nginx/sites-available/banya /etc/nginx/sites-enabled/banya
fi

nginx -t
systemctl restart nginx

curl -s -o /dev/null -w "site_local: %{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "site_domain: %{http_code}\n" -H "Host: nikolaevskie.ru" http://127.0.0.1/
curl -s -o /dev/null -w "docs: %{http_code}\n" -H "Host: nikolaevskie.ru" http://127.0.0.1/docs
curl -s -o /dev/null -w "api: %{http_code}\n" -H "Host: nikolaevskie.ru" http://127.0.0.1/api/
