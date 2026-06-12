#!/bin/bash
ls -la /var/www/banya/ | head -10
ls -la /etc/nginx/sites-enabled/
tail -20 /var/log/nginx/error.log
curl -v http://127.0.0.1/ 2>&1 | head -30
