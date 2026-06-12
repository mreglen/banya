#!/bin/bash
set -euo pipefail

echo "=== Services ==="
systemctl is-active banya-backend nginx postgresql

echo "=== Backend local ==="
curl -s -o /dev/null -w "docs: %{http_code}\n" http://127.0.0.1:8000/docs

echo "=== Nginx public ==="
curl -s -o /dev/null -w "site: %{http_code}\n" http://89.108.88.31/
curl -s -o /dev/null -w "docs: %{http_code}\n" http://89.108.88.31/docs
curl -s -o /dev/null -w "api_org: %{http_code}\n" http://89.108.88.31/api/organization/

echo "=== Backend logs (last 5) ==="
journalctl -u banya-backend -n 5 --no-pager
