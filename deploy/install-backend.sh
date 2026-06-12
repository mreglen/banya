#!/bin/bash
# Установка backend в venv (Python 3.12). Запускать из корня репозитория или с путём к backend.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${1:-$(dirname "$SCRIPT_DIR")/backend}"

if [[ ! -f "$BACKEND_DIR/requirements.txt" ]]; then
  echo "Ошибка: не найден $BACKEND_DIR/requirements.txt"
  exit 1
fi

if ! command -v python3.12 &>/dev/null; then
  echo "Ошибка: python3.12 не установлен. Сначала запустите: bash deploy/install-system.sh"
  exit 1
fi

cd "$BACKEND_DIR"

echo "==> Пересоздание venv на Python 3.12..."
rm -rf venv
python3.12 -m venv venv

# shellcheck disable=SC1091
source venv/bin/activate

echo "==> Обновление pip..."
pip install --upgrade pip setuptools wheel

echo "==> Установка зависимостей..."
pip install -r requirements.txt

echo "==> Проверка..."
python -c "import fastapi, uvicorn, pydantic_core, PIL; print('OK:', fastapi.__version__)"

echo ""
echo "Python:  $(which python)"
echo "Uvicorn: $(which uvicorn)"
echo ""
echo "Запуск вручную:"
echo "  $BACKEND_DIR/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000"
