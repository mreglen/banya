# Добавление Skeleton Screens в админ-панель

## Задача
Создать уникальные skeleton screens для каждой страницы админ-панели, которые будут отображаться во время загрузки данных.

## Текущее состояние
Сейчас все страницы используют простой текст "Загрузка..." в процессе загрузки данных:
- [AdminReservations.jsx](file:///c:/Users/khram/OneDrive/Рабочий%20стол/projects/banya/frontend/my-banya/src/pages/Admin/Reservations/AdminReservations.jsx#L184-L190)
- [Storage.jsx](file:///c:/Users/khram/OneDrive/Рабочий%20стол/projects/banya/frontend/my-banya/src/pages/Admin/Storage/Storage.jsx#L76-L78)
- И другие страницы

## План реализации

### Шаг 1: Создать базовый компонент Skeleton

**Файл:** `frontend/my-banya/src/components/UI/Skeleton/Skeleton.jsx` (создать)

Создать переиспользуемый компонент с вариантами:
- `Skeleton.Text` - для текста (заголовки, параграфы)
- `Skeleton.Card` - для карточек
- `Skeleton.Table` - для таблиц
- `Skeleton.Button` - для кнопок

Пример:
```jsx
function Skeleton({ className, variant = 'text' }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  const variantClasses = {
    text: 'h-4',
    title: 'h-6',
    card: 'h-32',
    button: 'h-10',
  };
  
  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
}
```

### Шаг 2: Создать уникальные skeleton для каждой страницы

#### 2.1 Dashboard Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/AdminDashboardSkeleton.jsx` (создать)

Структура:
- Заголовок (h1)
- Подзаголовок (p)
- 3 карточки в grid

#### 2.2 Reservations Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Reservations/ReservationsSkeleton.jsx` (создать)

Структура:
- Заголовок с датой
- Фильтры (кнопки, date picker)
- Табы для переключения бань
- Таблица/карточки с временными слотами
- 2-3 строки бронирований в skeleton формате

#### 2.3 Storage Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Storage/StorageSkeleton.jsx` (создать)

Структура:
- Заголовок "Склад"
- Кнопка фильтра
- Двухколоночный layout:
  - Левая колонка: дерево категорий (5-6 items)
  - Правая колонка: таблица товаров (5-6 строк)

#### 2.4 Documents Entrance Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Documents/DocumentsEntrance/DocumentsEntranceSkeleton.jsx` (создать)

Структура:
- Заголовок
- Кнопка "Новый документ"
- Таблица документов (5-6 строк)

#### 2.5 Documents Realization Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Documents/DocumentsRealization/DocumentsRealizationSkeleton.jsx` (создать)

Структура:
- Аналогично Documents Entrance

#### 2.6 Bookings Skeleton (Заявки с сайта)
**Файл:** `frontend/my-banya/src/pages/Admin/AdminBookings/AdminBookingsSkeleton.jsx` (создать)

Структура:
- Заголовок
- 3-4 карточки заявок в skeleton формате

#### 2.7 Clients Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Company/Clients/ClientsSkeleton.jsx` (создать)

Структура:
- Заголовок
- Кнопка добавления
- Таблица клиентов

#### 2.8 Users Skeleton (Сотрудники)
**Файл:** `frontend/my-banya/src/pages/Admin/Company/Staffs/UsersSkeleton.jsx` (создать)

Структура:
- Аналогично Clients

#### 2.9 Partners Skeleton (Поставщики)
**Файл:** `frontend/my-banya/src/pages/Admin/Company/Partners/PartnersSkeleton.jsx` (создать)

Структура:
- Аналогично Clients

#### 2.10 Baths Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/AdminBaths/AdminBathsSkeleton.jsx` (создать)

Структура:
- Заголовок
- Кнопка добавления
- Карточки бань с изображениями-placeholder

#### 2.11 Promotions Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Promotions/PromotionsSkeleton.jsx` (создать)

Структура:
- Заголовок
- Кнопка добавления
- Список акций

#### 2.12 Settings Skeleton
**Файл:** `frontend/my-banya/src/pages/Admin/Settings/SettingsSkeleton.jsx` (создать)

Структура:
- Заголовок
- 4-5 секций с полями форм

### Шаг 3: Интегрировать skeleton в каждую страницу

Для каждой страницы:
1. Импортировать соответствующий skeleton компонент
2. Заменить текущий `<div>Загрузка...</div>` на skeleton компонент
3. Условие: показывать skeleton пока `isLoading === true`

Пример для Reservations:
```jsx
import ReservationsSkeleton from './ReservationsSkeleton';

if (isLoadingBaths || isLoadingReservations) {
  return <ReservationsSkeleton />;
}
```

### Шаг 4: Добавить анимацию и стили

Все skeleton компоненты должны использовать:
- Tailwind class `animate-pulse` для пульсации
- Цвет `bg-gray-200` или `bg-gray-300`
- Скругление `rounded` или `rounded-lg`
- Адаптивность через breakpoints

### Шаг 5: Протестировать

Проверить:
1. Все страницы показывают skeleton при загрузке
2. Skeleton соответствует структуре контента
3. Анимация плавная
4. Адаптивность на мобильных устройствах

## Список файлов для создания

1. `src/components/UI/Skeleton/Skeleton.jsx`
2. `src/pages/Admin/AdminDashboardSkeleton.jsx`
3. `src/pages/Admin/Reservations/ReservationsSkeleton.jsx`
4. `src/pages/Admin/Storage/StorageSkeleton.jsx`
5. `src/pages/Admin/Documents/DocumentsEntrance/DocumentsEntranceSkeleton.jsx`
6. `src/pages/Admin/Documents/DocumentsRealization/DocumentsRealizationSkeleton.jsx`
7. `src/pages/Admin/AdminBookings/AdminBookingsSkeleton.jsx`
8. `src/pages/Admin/Company/Clients/ClientsSkeleton.jsx`
9. `src/pages/Admin/Company/Staffs/UsersSkeleton.jsx`
10. `src/pages/Admin/Company/Partners/PartnersSkeleton.jsx`
11. `src/pages/Admin/AdminBaths/AdminBathsSkeleton.jsx`
12. `src/pages/Admin/Promotions/PromotionsSkeleton.jsx`
13. `src/pages/Admin/Settings/SettingsSkeleton.jsx`

## Список файлов для редактирования

1. `src/pages/Admin/AdminDashboard.jsx`
2. `src/pages/Admin/Reservations/AdminReservations.jsx`
3. `src/pages/Admin/Storage/Storage.jsx`
4. `src/pages/Admin/Documents/DocumentsEntrance/DocumentEntrance.jsx`
5. `src/pages/Admin/Documents/DocumentsRealization/DocumentsRealization.jsx`
6. `src/pages/Admin/AdminBookings/AdminBookings.jsx`
7. `src/pages/Admin/Company/Clients/Clients.jsx`
8. `src/pages/Admin/Company/Staffs/Users.jsx`
9. `src/pages/Admin/Company/Partners/Partner.jsx`
10. `src/pages/Admin/AdminBaths/AdminBathsList.jsx`
11. `src/pages/Admin/Promotions/Promotions.jsx`
12. `src/pages/Admin/Settings/SettingsPage.jsx`

## Приоритет выполнения

**Высокий приоритет (основные страницы):**
1. Dashboard
2. Reservations (бронирования)
3. Storage (склад)
4. Documents (документы)
5. Bookings (заявки)

**Средний приоритет:**
6. Clients
7. Users
8. Partners
9. Baths

**Низкий приоритет:**
10. Promotions
11. Settings

## Технические детали

- Использовать Tailwind CSS для стилизации
- Анимация через `animate-pulse`
- Все skeleton компоненты должны быть функциональными React компонентами
- Следовать существующей дизайн-системе проекта
- Обеспечить адаптивность для мобильных устройств
