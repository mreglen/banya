export function formatFinanceCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/** Человекочитаемое описание источника операции */
export function getOperationMeta(operation) {
  if (!operation) {
    return { category: '—', hint: '', badgeClass: 'bg-gray-100 text-gray-700' };
  }

  if (operation.source === 'entrance') {
    return {
      category: 'Закупка',
      hint: 'Расход: оплата поставщику (документ поступления на склад)',
      badgeClass: 'bg-orange-100 text-orange-800',
      detailTitle: 'Поступление товара',
    };
  }

  if (operation.operation_type === 'income') {
    return {
      category: 'Бронь',
      hint: 'Приход: бронь закрыта, зафиксирована оплата клиента',
      badgeClass: 'bg-green-100 text-green-800',
      detailTitle: 'Оплата по брони',
    };
  }

  return {
    category: 'Бронь',
    hint: 'Расход: отменено закрытие брони (сторно)',
    badgeClass: 'bg-amber-100 text-amber-800',
    detailTitle: 'Сторно по брони',
  };
}

export function getOperationListTitle(operation) {
  const meta = getOperationMeta(operation);
  if (operation.source === 'entrance') {
    return operation.title || 'Поступление на склад';
  }
  if (operation.operation_type === 'income') {
    return operation.title ? `Оплата: ${operation.title}` : 'Оплата по брони';
  }
  return operation.title ? `Сторно: ${operation.title}` : 'Отмена закрытия брони';
}

export function getOperationSubtitle(operation) {
  const parts = [];
  const meta = getOperationMeta(operation);
  parts.push(meta.category);

  if (operation.subtitle) {
    parts.push(operation.subtitle);
  }

  if (operation.source === 'realization' && operation.operation_type === 'income') {
    parts.push('статус брони → закрыт');
  }

  return parts.join(' • ');
}
