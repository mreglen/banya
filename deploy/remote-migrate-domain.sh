#!/bin/bash
# Миграция на домен nikolaevskie.ru — запускать на сервере из /root/banya
set -euo pipefail

ROOT="/root/banya"
cd "$ROOT"

echo "==> 1/5 backend .env (CORS)"
bash deploy/remote-setup-env.sh

echo "==> 2/5 frontend build"
cd "$ROOT/frontend/my-banya"
echo 'REACT_APP_API_URL=/api' > .env
npm install
npm run build

echo "==> 3/5 nginx"
bash "$ROOT/deploy/remote-fix-nginx.sh"

echo "==> 4/5 SSL (если DNS указывает на сервер)"
if getent ahostsv4 nikolaevskie.ru 2>/dev/null | grep -q '89.108.88.31'; then
  bash "$ROOT/deploy/remote-setup-ssl.sh" || echo "WARN: SSL не выпущен — проверьте DNS и повторите: bash deploy/remote-setup-ssl.sh"
else
  echo "WARN: nikolaevskie.ru ещё не указывает на 89.108.88.31 — SSL пропущен"
  echo "      После настройки DNS: bash deploy/remote-setup-ssl.sh"
fi

echo "==> 5/5 restart backend"
systemctl restart banya-backend

bash "$ROOT/deploy/remote-verify.sh"
echo "Миграция завершена."
