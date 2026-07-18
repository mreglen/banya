#!/usr/bin/env python3
"""Add documents:edit permission on remote DB via SSH."""
import os
import sys

import paramiko

HOST = os.environ.get("BANYA_SSH_HOST", "89.108.88.31")
USER = os.environ.get("BANYA_SSH_USER", "root")
PASSWORD = os.environ.get("BANYA_SSH_PASSWORD", "")

REMOTE_CMD = r"""
set -euo pipefail
if [ -f /root/banya/backend/.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /root/banya/backend/.env
  set +a
fi

run_sql() {
  if [ -n "${DATABASE_URL:-}" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
  else
    sudo -u postgres psql -d banya -v ON_ERROR_STOP=1 "$@"
  fi
}

run_sql <<'EOSQL'
INSERT INTO permissions (code, name, category, description)
SELECT 'documents:edit', 'Редактирование документов поступления', 'documents', NULL
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'documents:edit');

SELECT id, code, name, category FROM permissions WHERE category = 'documents' ORDER BY id;
EOSQL
"""


def main() -> int:
    if not PASSWORD:
        print("Set BANYA_SSH_PASSWORD", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    _, stdout, stderr = client.exec_command(REMOTE_CMD, timeout=60)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print("STDERR:", err)
    print("EXIT:", code)
    client.close()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
