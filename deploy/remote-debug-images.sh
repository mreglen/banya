#!/bin/bash
systemctl is-active banya-backend
curl -s -o /dev/null -w "logo:%{http_code} " http://127.0.0.1/img/Logo.png
curl -s -o /dev/null -w "bath_nginx:%{http_code} " http://127.0.0.1/uploads/photos/baths/d1c0ec5ea0f7d039.webp
curl -s -o /dev/null -w "bath_direct:%{http_code}\n" http://127.0.0.1:8000/uploads/photos/baths/d1c0ec5ea0f7d039.webp
journalctl -u banya-backend -n 5 --no-pager
