#!/usr/bin/env bash
# Обновление nginx на сервере из корня проекта banya.
#
# На сервере (из /root/banya):
#   bash reload-nginx.sh
#
# С локальной машины (Windows Git Bash / WSL / Linux):
#   export BANYA_SSH_PASSWORD='...'
#   bash reload-nginx.sh
#
# Опции:
#   --local   принудительно запустить deploy/reload-nginx.sh на этой машине
#   --remote  принудительно выполнить на удалённом сервере
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-auto}"

run_on_server() {
  bash "$ROOT/deploy/reload-nginx.sh"
}

run_on_remote() {
  local host="${BANYA_SSH_HOST:-89.108.88.31}"
  local user="${BANYA_SSH_USER:-root}"
  local remote_dir="${BANYA_REMOTE_DIR:-/root/banya}"

  if [[ -f "$ROOT/deploy/upload_and_run.py" ]] && [[ -n "${BANYA_SSH_PASSWORD:-}" ]]; then
    echo "==> Загрузка deploy-скриптов и запуск reload-nginx.sh на $user@$host"
    python "$ROOT/deploy/upload_and_run.py" reload-nginx.sh
    return $?
  fi

  if ! command -v ssh &>/dev/null; then
    echo "Ошибка: ssh не найден. Установите OpenSSH или задайте BANYA_SSH_PASSWORD для upload_and_run.py" >&2
    exit 1
  fi

  echo "==> Копирование конфига на $user@$host:$remote_dir/deploy/"
  scp -o StrictHostKeyChecking=accept-new \
    "$ROOT/deploy/nginx-banya.conf" \
    "$ROOT/deploy/reload-nginx.sh" \
    "$user@$host:$remote_dir/deploy/"

  echo "==> Запуск reload-nginx.sh на сервере"
  ssh -o StrictHostKeyChecking=accept-new "$user@$host" \
    "chmod +x $remote_dir/deploy/reload-nginx.sh && bash $remote_dir/deploy/reload-nginx.sh"
}

is_server() {
  [[ -f /etc/nginx/nginx.conf ]] && [[ -d "$ROOT/deploy" ]]
}

case "$MODE" in
  --local)
    run_on_server
    ;;
  --remote)
    run_on_remote
    ;;
  auto|"")
    if is_server; then
      run_on_server
    else
      run_on_remote
    fi
    ;;
  -h|--help)
    sed -n '2,14p' "$0"
    ;;
  *)
    echo "Неизвестный аргумент: $MODE (используйте --local, --remote или без аргументов)" >&2
    exit 1
    ;;
esac
