---
name: Finance tab
overview: "Добавим вкладку «Финансы» в админке: список операций (приход/расход) с фильтрами как в банке, итоги за месяц, модалки деталей операции и редактирование счетов организации (только админ/директор). Операции будут формироваться автоматически из документов: расход = `entrance_documents`, приход = `realization_documents` (без задвоения)."
todos:
  - id: db-sql
    content: "Подготовить единый SQL: organization_accounts + account_id в documents + seed permissions finance:*"
    status: completed
  - id: backend-finance
    content: Добавить models/schemas/router для finance accounts/operations/summary + подключить в api_router
    status: completed
  - id: frontend-finance
    content: Добавить страницу /admin/finance с фильтрами, списком, модалками + добавить роут и пункты меню + RTK endpoints
    status: completed
isProject: false
---

# Вкладка «Финансы» (авто из документов)

## Что будет в UI
- **Экран `/admin/finance`**: верхняя панель фильтров (тип операции, период, счет), блок **«за месяц»** (итого приход/расход), ниже **история** списком.
- **Клик по операции**: модалка с подробностями.
  - Для расхода: детали `EntranceDocument` (поставщик, ответственный, комментарий, позиции, сумма, дата).
  - Для прихода: детали `RealizationDocument` (клиент, баня, позиции, сумма, дата).
- **Счета организации**: список счетов + **редактирование в модалке** (банк, номер счета, активен) только если `user.is_admin || user.is_director`.

## Решение по источникам операций (важно)
- **Приход**: только `realization_documents` (они создаются при переводе брони в статус `закрыт`, см. логика в `[backend/app/routers/admin_reservations.py](backend/app/routers/admin_reservations.py)`).
- **Расход**: `entrance_documents`.
- Это устраняет риск задвоения (т.к. `realization_documents.total_amount` сейчас уже равен `Reservation.total_cost`).

## Изменения БД (единый SQL-скрипт)
Создаем один файл в `[backend/sql](backend/sql)` (как уже принято в проекте).

- **Новая таблица** `organization_accounts`:
  - `id` (PK)
  - `bank_name` (text)
  - `account_number` (text)
  - `is_active` (bool, default true)
  - `created_at/updated_at`
- **Связь счета с документами** (чтобы работал фильтр «счет»):
  - `ALTER TABLE entrance_documents ADD COLUMN account_id int NULL REFERENCES organization_accounts(id)`
  - `ALTER TABLE realization_documents ADD COLUMN account_id int NULL REFERENCES organization_accounts(id)`
  - индексы по `(date)` и `(account_id, date)` для быстрых фильтров
- **RBAC (new permissions)**: добавить `finance:view` и `finance:accounts_manage` в таблицу `permissions`, и прикрепить к ролям админ/директор (по аналогии с `[backend/sql/2026-05-07_03_seed_permissions_for_reservations_and_admin.sql](backend/sql/2026-05-07_03_seed_permissions_for_reservations_and_admin.sql)`).

## Backend API (FastAPI)
Добавим новый роутер и подключим его в `[backend/app/routers/__init__.py](backend/app/routers/__init__.py)`.

- **Accounts**
  - `GET /api/finance/accounts` — список счетов (для фильтра)
  - `POST/PUT/DELETE /api/admin/finance/accounts` — CRUD счетов (только админ/директор)
- **Operations**
  - `GET /api/finance/operations` — объединенный список операций с фильтрами:
    - `type=income|expense|all`
    - `period=month|custom|all` + `date_from/date_to`
    - `account_id`
    - `skip/limit`
  - `GET /api/finance/summary` — итоги за месяц (приход/расход, опционально `account_id`)
  - `GET /api/finance/operation/{source}/{id}` — детали для модалки, где `source in (entrance, realization)`

- **Нормализованный DTO операции** (пример полей):
  - `source` (`entrance`/`realization`)
  - `operation_type` (`expense`/`income`)
  - `id`, `date`, `amount`, `title`, `subtitle`, `account_id`

## Frontend (React)
- **Новый раздел** `[frontend/my-banya/src/pages/Admin/Finance](frontend/my-banya/src/pages/Admin/Finance)`:
  - `Finance.jsx` (экран)
  - `OperationDetailsModal.jsx`
  - `AccountsModal.jsx` (редактирование счетов, только админ/директор)
- **Роут**: добавить `Route path="finance"` в `[frontend/my-banya/src/App.js](frontend/my-banya/src/App.js)` под `RoleBasedRoute requiredPermission="finance:view"`.
- **Навигация**: добавить пункт «Финансы»
  - в `[frontend/my-banya/src/pages/Admin/MobileSidebar.jsx](frontend/my-banya/src/pages/Admin/MobileSidebar.jsx)` (как обычный `NavLink`)
  - в `[frontend/my-banya/src/components/Admin/MobileBottomNav.jsx](frontend/my-banya/src/components/Admin/MobileBottomNav.jsx)` (через `useHasAccess('finance:view')`)
- **RTK Query**: расширить `[frontend/my-banya/src/redux/slices/apiSlice.js](frontend/my-banya/src/redux/slices/apiSlice.js)` эндпоинтами `finance` (accounts, operations, summary, details).

## Минимальные UX детали «как в банке»
- Фильтры сверху: `Тип операции`, `Период` (месяц/все/произвольный), `Счет` (выпадашка), кнопка «Сбросить».
- Список: строка с иконкой, названием (контрагент/клиент), датой, суммой справа; цвет суммы зеленый/красный.
- По умолчанию: период = **текущий месяц**.

## Примечания/ограничения
- Пока у существующих документов `account_id` будет `NULL` (пока не начнете проставлять). В UI можно показывать «Без счета» и давать фильтр.
- Если хотите автопривязку, можно добавить правило: «если есть ровно 1 активный счет — назначать его новым документам по умолчанию» (это можно включить отдельным коммитом).
