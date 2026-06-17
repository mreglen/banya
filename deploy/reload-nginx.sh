#!/bin/bash
# Пересборка/обновление nginx-конфига и публикация фронтенда.
# Запуск на сервере:
#   bash /root/banya/deploy/reload-nginx.sh
# или из корня проекта:
#   bash reload-nginx.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="${BANYA_PROJECT_ROOT:-$PROJECT_ROOT}"

WEB_ROOT="${BANYA_WEB_ROOT:-/var/www/banya}"
NGINX_SITE="${BANYA_NGINX_SITE:-/etc/nginx/sites-available/banya}"
DOMAIN="${BANYA_DOMAIN:-nikolaevskie.ru}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-nikolaevskiebani@yandex.ru}"

echo "==> Проект: $PROJECT_ROOT"
echo "==> Web root: $WEB_ROOT"

if ! command -v nginx &>/dev/null; then
  echo "Ошибка: nginx не установлен на этой машине." >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ошибка: запустите скрипт от root (sudo bash reload-nginx.sh)." >&2
  exit 1
fi

# Nginx (www-data) не читает файлы из /root — публикуем build в /var/www
mkdir -p "$WEB_ROOT" "$PROJECT_ROOT/backend/public/img"

if [[ -d "$PROJECT_ROOT/frontend/my-banya/public/img" ]]; then
  rsync -a "$PROJECT_ROOT/frontend/my-banya/public/img/" "$PROJECT_ROOT/backend/public/img/"
fi

if [[ -d "$PROJECT_ROOT/frontend/my-banya/build" ]]; then
  echo "==> Публикация frontend build -> $WEB_ROOT"
  rsync -a --delete "$PROJECT_ROOT/frontend/my-banya/build/" "$WEB_ROOT/"
else
  echo "WARN: build не найден ($PROJECT_ROOT/frontend/my-banya/build). Пропускаем rsync фронтенда."
fi

echo "==> Установка nginx-конфига"
cp "$SCRIPT_DIR/nginx-banya.conf" "$NGINX_SITE"
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/banya

# Если SSL уже выпущен — заново применить сертификат к обновлённому конфигу
if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  echo "==> SSL найден — обновляем HTTPS-блок через certbot"
  if command -v certbot &>/dev/null; then
    certbot --nginx \
      -d "$DOMAIN" \
      -d "www.$DOMAIN" \
      --non-interactive \
      --agree-tos \
      -m "$CERTBOT_EMAIL" \
      --redirect \
      || echo "WARN: certbot не смог обновить SSL — проверьте конфиг вручную"
  else
    echo "WARN: certbot не установлен — HTTPS может не работать после обновления конфига"
  fi
fi

echo "==> Проверка и перезагрузка nginx"
nginx -t
systemctl reload nginx

echo "==> Проверка endpoints"
curl -s -o /dev/null -w "site_local: %{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "site_domain: %{http_code}\n" -H "Host: $DOMAIN" http://127.0.0.1/
curl -s -o /dev/null -w "sitemap: %{http_code}\n" -H "Host: $DOMAIN" http://127.0.0.1/sitemap.xml
curl -s -o /dev/null -w "api: %{http_code}\n" -H "Host: $DOMAIN" http://127.0.0.1/api/
curl -s -o /dev/null -w "docs: %{http_code}\n" -H "Host: $DOMAIN" http://127.0.0.1/docs

echo "Готово: nginx перезагружен."
