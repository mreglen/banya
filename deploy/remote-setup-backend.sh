#!/bin/bash
set -euo pipefail

cd /root/banya/backend
rm -rf venv
python3.13 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -c 'import fastapi, uvicorn, pydantic_core, PIL; print("OK", fastapi.__version__)'
which python
which uvicorn
