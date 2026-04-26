// src/components/CategorySelectModal.jsx
import React, { useState, useEffect } from 'react';

const CategorySelectModal = ({
  isOpen,
  onClose,
  onSelect,
  categoriesTree,
  currentCategoryId = null, // Добавляем текущую категорию товара
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [searchText, setSearchText] = useState('');

  // При открытии модалки устанавливаем текущую категорию товара
  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentCategoryId);
    }
  }, [isOpen, currentCategoryId]);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Функция для проверки, содержит ли категория поисковый запрос
  const categoryMatchesSearch = (category, search) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return category.name.toLowerCase().includes(searchLower);
  };

  // Функция для проверки, содержит ли категория или её дети поисковый запрос
  const categoryOrChildrenMatch = (category, search) => {
    if (!search) return true;
    if (categoryMatchesSearch(category, search)) return true;
    if (category.children?.some(child => categoryOrChildrenMatch(child, search))) return true;
    return false;
  };

  const renderCategoryTree = (categories) => {
    return categories.map(cat => {
      // Если есть поиск, проверяем совпадение
      if (searchText && !categoryOrChildrenMatch(cat, searchText)) {
        return null;
      }

      const hasChildren = cat.children?.length > 0;
      const isExpanded = expanded.has(cat.id);
      
      // Автоматически раскрываем при поиске, если есть совпадения в детях
      const shouldExpand = searchText && cat.children?.some(child => categoryOrChildrenMatch(child, searchText));

      return (
        <div key={cat.id} className="ml-3">
          <div className="flex items-center py-1 px-1">
            {hasChildren ? (
              <span
                className="mr-1 cursor-pointer select-none"
                onClick={() => toggleExpand(cat.id)}
              >
                {isExpanded || shouldExpand ? '▼' : '►'}
              </span>
            ) : (
              <span className="mr-1 text-gray-500">•</span>
            )}
            <label className="flex items-center cursor-pointer ml-1">
              <input
                type="radio"
                name="select-category"
                checked={selectedId === cat.id}
                onChange={() => setSelectedId(cat.id)}
                className="mr-2"
              />
              <span className="truncate">{cat.name}</span>
            </label>
          </div>
          {hasChildren && (isExpanded || shouldExpand) && (
            <div className="ml-3">
              {renderCategoryTree(cat.children)}
            </div>
          )}
        </div>
      );
    }).filter(Boolean); // Убираем null (несовпадающие категории)
  };

  const handleSelect = () => {
    if (selectedId !== null) {
      onSelect(selectedId);
      onClose();
    } else {
      alert('Выберите категорию');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Выберите категорию</h3>

        {/* Поле поиска */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Введите название категории..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="mt-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Очистить поиск
            </button>
          )}
        </div>

        <div className="border rounded p-2 max-h-60 overflow-y-auto mb-4">
          <label className="flex items-center cursor-pointer mb-2 px-1">
            <input
              type="radio"
              name="select-category"
              checked={selectedId === null}
              onChange={() => setSelectedId(null)}
              className="mr-2"
            />
            <span>Номенклатура (без категории)</span>
          </label>
          {renderCategoryTree(categoriesTree)}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Отмена
          </button>
          <button
            onClick={handleSelect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Выбрать
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategorySelectModal;