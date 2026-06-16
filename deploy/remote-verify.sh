#!/bin/bash
set -euo pipefail

DOMAIN="${BANYA_DOMAIN:-nikolaevskie.ru}"

echo "=== Services ==="
systemctl is-active banya-backend nginx postgresql

echo "=== Backend local ==="
curl -s -o /dev/null -w "docs: %{http_code}\n" http://127.0.0.1:8000/docs

echo "=== Nginx public ==="
curl -s -o /dev/null -w "site_http: %{http_code}\n" "http://${DOMAIN}/"
curl -s -o /dev/null -w "site_https: %{http_code}\n" "https://${DOMAIN}/" || true
curl -s -o /dev/null -w "docs: %{http_code}\n" "https://${DOMAIN}/docs" || curl -s -o /dev/null -w "docs: %{http_code}\n" "http://${DOMAIN}/docs"
curl -s -o /dev/null -w "api_org: %{http_code}\n" "https://${DOMAIN}/api/organization/" || curl -s -o /dev/null -w "api_org: %{http_code}\n" "http://${DOMAIN}/api/organization/"

echo "=== Backend logs (last 5) ==="
journalctl -u banya-backend -n 5 --no-pager
