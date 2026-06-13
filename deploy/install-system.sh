#!/bin/bash
# Системные пакеты для Ubuntu VPS (запускать от root)
set -euo pipefail

echo "==> Обновление системы..."
apt update && apt upgrade -y

echo "==> Базовые утилиты..."
apt install -y curl git ufw software-properties-common

echo "==> Python 3.12..."
if ! command -v python3.12 &>/dev/null; then
  add-apt-repository -y ppa:deadsnakes/ppa
  apt update
  apt install -y python3.12 python3.12-venv python3.12-dev
else
  apt install -y python3.12 python3.12-venv python3.12-dev
fi

echo "==> Зависимости для сборки Python-пакетов..."
apt install -y \
  build-essential \
  libpq-dev \
  libffi-dev \
  libjpeg-dev zlib1g-dev libpng-dev libtiff-dev libwebp-dev \
  libfreetype6-dev liblcms2-dev libopenjp2-7-dev

echo "==> PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

echo "==> Node.js 20 LTS..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "==> Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

echo "==> Swap 2 GB (для VPS с 1 GB RAM)..."
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Файрвол..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

echo "==> Часовой пояс Europe/Moscow..."
timedatectl set-timezone Europe/Moscow

echo ""
echo "Готово. Версии:"
python3.12 --version
node --version
npm --version
free -h
