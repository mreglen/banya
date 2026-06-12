# Установка сервера Ubuntu для проекта «Бани»

Инструкция для **пустого VPS** (Ubuntu 22.04 / 24.04). Работаем под **root**.

### Стек (стабильные версии)

| Компонент | Версия |
|-----------|--------|
| Python | **3.12** (не системный 3.14!) |
| Node.js | **20 LTS** |
| PostgreSQL | из репозитория Ubuntu |
| Backend | FastAPI + uvicorn **из venv** |
| Frontend | React → статика через Nginx |

> **Главное правило:** все Python-пакеты ставятся только в `/root/banya/backend/venv`.  
> Никогда не запускайте системный `uvicorn` — он из Python 3.14 и не видит `fastapi`.

---

## Что понадобится

| Что | Пример |
|-----|--------|
| IP сервера | `123.45.67.89` |
| Домен | `banya.example.ru` |
| Пароль root | от хостинга |
| Репозиторий | `https://github.com/you/banya.git` |

---

## 1. Вход на сервер

```bash
ssh root@123.45.67.89
```

---

## 2. Клонирование проекта

```bash
cd /root
git clone https://github.com/ВАШ_АККАУНТ/banya.git
cd banya
```

---

## 3. Установка системы (одна команда)

Скрипт ставит Python 3.12, PostgreSQL, Node 20, Nginx, swap и файрвол:

```bash
cd /root/banya
bash deploy/install-system.sh
```

Если после обновления ядра попросит перезагрузку:

```bash
reboot
```

Подключитесь снова и повторите `cd /root/banya`.

---

## 4. База данных PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER user_banya WITH PASSWORD 'ВАШ_ПАРОЛЬ_БД';
CREATE DATABASE banya OWNER user_banya;
GRANT ALL PRIVILEGES ON DATABASE banya TO user_banya;
\q
```

---

## 5. Backend

### 5.1. Установка Python-пакетов

```bash
cd /root/banya
bash deploy/install-backend.sh
```

Скрипт сам создаёт venv на Python 3.12 и ставит все зависимости.

### 5.2. Файл `.env`

```bash
nano /root/banya/backend/.env
```

```env
DATABASE_URL=postgresql://user_banya:ВАШ_ПАРОЛЬ_БД@localhost:5432/banya

SECRET_KEY=придумайте_длинный_случайный_ключ_минимум_32_символа

EMAIL_HOST=mail.example.ru
EMAIL_PORT=465
EMAIL_HOST_USER=support@example.ru
EMAIL_HOST_PASSWORD=пароль_от_почты
EMAIL_FROM=support@example.ru

ALLOWED_ORIGINS=https://banya.example.ru,http://123.45.67.89
```

### 5.3. Папки для загрузок

```bash
mkdir -p /root/banya/backend/uploads
mkdir -p /root/banya/backend/public/img
```

### 5.4. Проверка

```bash
/root/banya/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

В другом окне SSH:

```bash
curl http://127.0.0.1:8000/docs
```

Работает — нажмите `Ctrl+C`.

---

## 6. Автозапуск Backend

```bash
cp /root/banya/deploy/banya-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable banya-backend
systemctl start banya-backend
systemctl status banya-backend
```

Должно быть `active (running)`.

---

## 7. Frontend

```bash
cd /root/banya/frontend/my-banya
npm install
```

```bash
nano /root/banya/frontend/my-banya/.env
```

```env
REACT_APP_API_URL=/api
```

```bash
npm run build
```

---

## 8. Nginx

Замените `DOMAIN_OR_IP` на домен и IP:

```bash
sed 's/DOMAIN_OR_IP/banya.example.ru 123.45.67.89/' \
  /root/banya/deploy/nginx-banya.conf > /etc/nginx/sites-available/banya

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/banya /etc/nginx/sites-enabled/banya
nginx -t
systemctl reload nginx
```

Откройте в браузере: `http://123.45.67.89`

---

## 9. HTTPS (если есть домен)

DNS: A-запись домена → IP сервера.

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d banya.example.ru
```

Обновите `ALLOWED_ORIGINS` в `/root/banya/backend/.env`:

```env
ALLOWED_ORIGINS=https://banya.example.ru
```

```bash
systemctl restart banya-backend
```

---

## 10. Проверка

| Что | Команда |
|-----|---------|
| Backend | `systemctl status banya-backend` |
| Nginx | `systemctl status nginx` |
| PostgreSQL | `systemctl status postgresql` |
| API | браузер → `/api/docs` |
| Сайт | браузер → главная страница |

---

## 11. Обновление одной командой

После первого `git pull` сделайте скрипт исполняемым:

```bash
cd /root/banya
chmod +x update
```

Дальше для любого обновления:

```bash
cd /root/banya
./update
```

Скрипт `update` сам выполнит: `git pull` → backend (`pip install`) → `npm install` + `npm run build` → публикация в `/var/www/banya` → перезапуск `banya-backend` и `nginx`.

---

## 12. Полезные команды

```bash
# Логи backend
journalctl -u banya-backend -f

# Логи Nginx
tail -f /var/log/nginx/error.log

# Перезапуск
systemctl restart banya-backend && systemctl reload nginx

# Проверка что uvicorn из venv
ls -la /root/banya/backend/venv/bin/uvicorn
```

---

## 13. Если что-то сломалось

### Переустановить backend с нуля

```bash
cd /root/banya
bash deploy/install-system.sh   # если не хватает системных пакетов
bash deploy/install-backend.sh
systemctl restart banya-backend
```

### `ModuleNotFoundError: No module named 'fastapi'`

Запущен системный uvicorn. Используйте только:

```bash
/root/banya/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Ошибки сборки pip (Pillow, pydantic_core)

```bash
bash deploy/install-system.sh
bash deploy/install-backend.sh
```

### 502 Bad Gateway

```bash
systemctl status banya-backend
journalctl -u banya-backend -n 50 --no-pager
```

---

## 14. Требования к VPS

| | Минимум | Рекомендуется |
|--|---------|---------------|
| RAM | 1 GB (+ swap 2 GB) | 2 GB |
| CPU | 1 ядро | 2 ядра |
| Диск | 20 GB | 40 GB |
| ОС | Ubuntu 22.04 / 24.04 | Ubuntu 24.04 LTS |

---

## Структура на сервере

```
/root/banya/
├── deploy/                  ← скрипты установки
├── backend/
│   ├── .env
│   ├── venv/                ← Python 3.12 + все пакеты
│   └── uploads/
└── frontend/my-banya/
    ├── .env
    └── build/               ← сайт для Nginx
```
