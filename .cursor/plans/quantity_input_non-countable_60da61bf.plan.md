---
name: quantity input non-countable
overview: "В модалке `/admin/reservations` → Добавить бронь поменять поле количества выбранного товара: сделать обычный текстовый ввод только с цифрами, с возможностью полностью стереть, и снять верхний лимит для товаров с `is_countable = false` (например, услуги/массажи)."
todos:
  - id: pass-is-countable
    content: Прокинуть is_countable из stockProducts в selectedProducts (в handleSelectProduct и в useEffect редактирования)
    status: completed
  - id: input-text-digits
    content: Заменить type=number на type=text с inputMode=numeric, убрать min/max и onBlur-автозаполнение
    status: completed
  - id: update-quantity-fn
    content: "Переписать updateProductQuantity: разрешить пустую строку и только цифры, без клампинга по available"
    status: completed
  - id: render-availability
    content: "Скрыть/заменить строку \"Доступно: ...\" для товаров с is_countable=false"
    status: completed
  - id: validation
    content: "В validateForm: проверять верхний лимит available только для исчисляемых, для пустого quantity — ошибка \"Минимум 1\""
    status: completed
isProject: false
---

## Что меняем

Все изменения только во фронтовом файле [frontend/my-banya/src/pages/Admin/Reservations/AddBookingModal.jsx](frontend/my-banya/src/pages/Admin/Reservations/AddBookingModal.jsx). Backend не трогаем — флаг `is_countable` уже есть в [backend/app/models.py](backend/app/models.py) и в схеме `StockProduct` в [backend/app/schemas.py](backend/app/schemas.py), поэтому приходит с `useGetStockProductsQuery()`.

## 1. Прокидывать `is_countable` в выбранный товар

В `handleSelectProduct` (рядом с `unit_id`/`unit_name`) брать из `stockItem`:

```jsx
const isCountable = stockItem?.is_countable ?? true;
// ...
selectedProducts: [
  ...prev.selectedProducts,
  {
    id: product.id,
    name: product.name,
    purchase_price: product.last_purchase_price || 0,
    available: stockItem?.total_quantity || 0,
    unit_id: stockItem?.unit_id || null,
    unit_name: unitName,
    is_countable: isCountable,
    quantity: 1,
  }
]
```

Аналогично в `useEffect` для режима редактирования (`booking && statusOptions.length > 0`) при маппинге `booking.products` — добавить `is_countable: stockItem?.is_countable ?? true`.

## 2. Поле ввода количества

В блоке рендера товаров (сейчас `type="number"` в `selectedProducts.map(...)`):

- Заменить `type="number"` на `type="text"` + `inputMode="numeric"` + `pattern="\\d*"` — это убирает стрелки и оставляет цифровую клавиатуру на мобильном.
- Убрать `min`/`max` атрибуты с input.
- `onChange` пропускает только пустую строку или цифры (см. п.3).
- Удалить `onBlur={() => handleQuantityBlur(item.id)}`, чтобы поле могло остаться пустым при редактировании (пользователь явно просил “можно полностью стереть”). Функцию `handleQuantityBlur` тоже можно удалить.
- Строку `Доступно: {item.available} {item.unit_name}` показывать только если `item.is_countable !== false`. Для неисчисляемых вместо неё показать, например, “Не исчисляемая позиция (например, услуга)”.

Итоговый input выглядит так:

```jsx
<input
  type="text"
  inputMode="numeric"
  pattern="\d*"
  value={item.quantity}
  onChange={(e) => updateProductQuantity(item.id, e.target.value)}
  className={`w-16 px-2 py-1 border rounded text-sm ${
    validationErrors[`product_${item.id}`]
      ? 'border-red-500 bg-red-50'
      : 'border-gray-300'
  }`}
/>
```

## 3. `updateProductQuantity` — только цифры, без верхнего лимита для неисчисляемых

Сейчас функция всегда клампит к `[1, available]`. Меняем на:

- Если `newQty === ''` — оставляем пустое значение.
- Если строка не из цифр (`/^\d+$/`) — игнорируем ввод.
- Иначе записываем число; для исчисляемых (`is_countable === true`) можно мягко клампить сверху до `available` либо не клампить, а оставить только проверку при submit (предлагаю не клампить, чтобы поле было предсказуемым; превышение покажет валидация).

Эскиз:

```jsx
const updateProductQuantity = (productId, newQty) => {
  if (newQty !== '' && !/^\d+$/.test(newQty)) return;
  setFormData(prev => ({
    ...prev,
    selectedProducts: prev.selectedProducts.map(p =>
      p.id === productId
        ? { ...p, quantity: newQty === '' ? '' : parseInt(newQty, 10) }
        : p
    )
  }));
};
```

## 4. Валидация при submit (`validateForm`)

В цикле по `formData.selectedProducts`:

- Если `quantity === '' || quantity < 1` → ошибка “Минимум 1”.
- Только для исчисляемых (`product.is_countable !== false`): если `quantity > product.available` → ошибка “Превышает доступное количество (X)”.
- Для неисчисляемых верхний предел не проверяем (пример пользователя — услуга “массаж”, может быть любое количество).

## 5. Чек на submit

В `handleSubmit` уже есть `parseInt(p.quantity) || 1` при формировании payload — это корректно отработает для пустого значения, но валидация на шаге 4 не пропустит пустое поле, так что до payload оно не дойдёт. Менять ничего не нужно.

## Что не меняется

- `ProductSelectionModal` ([frontend/my-banya/src/pages/Admin/Documents/DocumentsEntrance/ProductSelectionModal.jsx](frontend/my-banya/src/pages/Admin/Documents/DocumentsEntrance/ProductSelectionModal.jsx)) — там товары уже отображаются нормально, отдельная модалка выбора, её не трогаем.
- Backend, схемы и API — `is_countable` уже передаётся.