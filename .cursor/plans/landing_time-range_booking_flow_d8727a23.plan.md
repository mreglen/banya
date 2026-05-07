---
name: Landing time-range booking flow
overview: Перестроить лендинговое бронирование на выбор интервала по двум кликам (заезд/выезд, включая переход через полночь) и добавить на странице заявок с сайта подтверждение через предзаполненную модалку создания брони.
todos:
  - id: landing-ui-order-and-range
    content: Перестроить форму лендоса на выбор бани первым и интервал времени по двум кликам
    status: completed
  - id: landing-availability-hours
    content: Построить отображение свободных слотов и расчет duration_hours с учетом перехода через полночь
    status: completed
  - id: admin-bookings-confirm-button
    content: Добавить кнопку подтверждения заявки и открытие предзаполненной AddBookingModal
    status: completed
  - id: confirm-to-reservations-navigation
    content: После успешного создания брони перейти в /admin/reservations и пометить заявку прочитанной
    status: completed
  - id: validate-and-test-flow
    content: Проверить ключевые сценарии и валидации по новому UX
    status: completed
isProject: false
---

# План: интервал времени на лендинге и подтверждение заявки в бронь

## Что уже есть в коде
- Лендос бронирования сейчас работает через `date + duration_hours + bath_id` в форме [C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Booking/Booking.jsx](C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Booking/Booking.jsx).
- Заявки с сайта отображаются без кнопки подтверждения брони в [C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Admin/AdminBookings/AdminBookings.jsx](C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Admin/AdminBookings/AdminBookings.jsx).
- Модалка создания/редактирования брони уже умеет работать с датой/временем и товарами: [C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Admin/Reservations/AddBookingModal.jsx](C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Admin/Reservations/AddBookingModal.jsx).

## Шаг 1. Лендос: перестроить UX на «сначала баня, потом интервал»
Изменить форму в [C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Booking/Booking.jsx](C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Booking/Booking.jsx):
- Порядок полей: `bath_id` первым, затем выбор даты/времени.
- Добавить 2 поля времени: `checkin_time` и `checkout_time` (или внутренние `start_datetime/end_datetime`), убрать ручной `duration_hours` из UI.
- Реализовать выбор по двум кликам:
  - первый клик в сетке свободных слотов = начало,
  - второй клик = конец,
  - автоматически вычислить `duration_hours` для текущего API.
- Поддержать переход через полночь (если конец меньше начала, трактуем как следующий день).

## Шаг 2. Лендос: вычисление свободных часов
В том же файле использовать существующий источник занятости (по аналогии с админской модалкой):
- Подключить запрос свободности/резерваций на выбранную дату и баню.
- Построить список/сетку доступных получасовых слотов.
- Блокировать занятые интервалы и не позволять выбрать конец раньше начала в рамках сценария интервала.
- Преобразовывать выбранный интервал в payload для `createBooking`:
  - `date` = дата старта,
  - `duration_hours` = разница между стартом и концом (с учетом перехода через полночь).

## Шаг 3. Заявки с сайта: кнопка «Подтвердить бронь»
В [C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Admin/AdminBookings/AdminBookings.jsx](C:/Users/khram/OneDrive/Рабочий стол/projects/banya/frontend/my-banya/src/pages/Admin/AdminBookings/AdminBookings.jsx):
- Добавить кнопку `Подтвердить бронь` в карточку заявки.
- По нажатию открывать `AddBookingModal` в режиме создания, с предзаполнением из заявки:
  - клиентские поля (`name/phone/email/notes`),
  - баня,
  - дата,
  - длительность/время старта по правилам (если в заявке нет точного времени — использовать дефолт, например первый доступный слот).

## Шаг 4. Подтверждение: переход в список броней
После успешного создания через модалку:
- Закрыть модалку.
- Пометить заявку как прочитанную (`mark-read`) для консистентности.
- Выполнить переход на страницу броней (`/admin/reservations`) с выбранной датой (через query/state), чтобы оператор сразу видел созданную бронь.

## Шаг 5. API-контракты (по необходимости)
Проверить, нужен ли бэкенд-апдейт для хранения точного времени в заявке:
- Текущий `Booking` API принимает только `date + duration_hours` ([C:/Users/khram/OneDrive/Рабочий стол/projects/banya/backend/app/routers/bookings.py](C:/Users/khram/OneDrive/Рабочий стол/projects/banya/backend/app/routers/bookings.py)).
- Базовый вариант (без миграций): на лендинге вычислять и отправлять только `duration_hours`, а конкретный слот выбирать уже при подтверждении в админке.
- Расширенный вариант (если потребуется точность в заявке): добавить в `Booking` поля времени и обновить схемы/роутер.

## Шаг 6. Проверка сценариев
Проверить вручную:
- Лендос: выбор бани → 2 клика интервала → корректная длительность, включая переход через полночь.
- Заявки: кнопка подтверждения открывает предзаполненную модалку.
- После сохранения: переход в брони и видимость созданной записи.
- Ошибки валидации: неполный интервал, занятый слот, нулевая/отрицательная длительность.
