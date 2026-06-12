#!/bin/bash
set -euo pipefail

# Nginx (www-data) cannot read files under /root — publish build to /var/www
mkdir -p /var/www/banya /root/banya/backend/public/img
rsync -a /root/banya/frontend/my-banya/public/img/ /root/banya/backend/public/img/
rsync -a --delete /root/banya/frontend/my-banya/build/ /var/www/banya/

cat > /etc/nginx/sites-available/banya << 'EOF'
server {
    listen 80;
    server_name 89.108.88.31;

    client_max_body_size 50M;

    root /var/www/banya;
    index index.html;

    # Static images from React build (Logo, bg-home, etc.)
    location ^~ /img/ {
        root /var/www/banya;
        try_files $uri =404;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /openapi.json {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

nginx -t
systemctl restart nginx

curl -s -o /dev/null -w "site_local: %{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "site_ip: %{http_code}\n" -H "Host: 89.108.88.31" http://127.0.0.1/
curl -s -o /dev/null -w "docs: %{http_code}\n" -H "Host: 89.108.88.31" http://127.0.0.1/docs
curl -s -o /dev/null -w "api: %{http_code}\n" -H "Host: 89.108.88.31" http://127.0.0.1/api/
