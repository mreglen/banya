#!/bin/bash
set -euo pipefail
cd /root/banya/backend
source venv/bin/activate
python seed_admin.py
