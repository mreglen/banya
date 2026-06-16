// src/components/CategorySelectModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useCreateCategoryMutation } from '../../../redux/slices/productsApiSlice';

const findCategoryById = (cats, id) => {
  for (const cat of cats) {
    if (cat.id === id) return cat;
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, id);
      if (found) return found;
    }
  }
  return null;
};

const CategorySelectModal = ({
  isOpen,
  onClose,
  onSelect,
  categoriesTree,
  currentCategoryId = null,
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [searchText, setSearchText] = useState('');
  const [mode, setMode] = useState('select');
  const [createParentId, setCreateParentId] = useState(null);
  const [createParentName, setCreateParentName] = useState('Номенклатура');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentCategoryId);
      setMode('select');
      setCreateParentId(null);
      setCreateParentName('Номенклатура');
      setNewCategoryName('');
      setSearchText('');
      setContextMenu(null);
    }
  }, [isOpen, currentCategoryId]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu, closeContextMenu]);

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

  const openCreateMode = (parentId, parentName) => {
    setCreateParentId(parentId);
    setCreateParentName(parentName);
    setNewCategoryName('');
    setMode('create');
    closeContextMenu();
  };

  const handleAddClick = () => {
    if (selectedId === null) {
      openCreateMode(null, 'Номенклатура');
    } else {
      const category = findCategoryById(categoriesTree, selectedId);
      openCreateMode(selectedId, category?.name || 'Номенклатура');
    }
  };

  const handleContextMenu = (e, category) => {
    e.preventDefault();
    e.stopPropagation();
    if (category) {
      setSelectedId(category.id);
    } else {
      setSelectedId(null);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, category });
  };

  const handleAddSubcategoryFromMenu = () => {
    const category = contextMenu?.category;
    if (category) {
      openCreateMode(category.id, category.name);
    } else {
      openCreateMode(null, 'Номенклатура');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Имя категории не может быть пустым');
      return;
    }

    try {
      const created = await createCategory({
        name: newCategoryName.trim(),
        parent_id: createParentId,
      }).unwrap();

      if (createParentId !== null) {
        setExpanded(prev => new Set([...prev, createParentId]));
      }

      setSelectedId(created.id);
      setMode('select');
      setNewCategoryName('');
    } catch (err) {
      console.error('Ошибка создания категории:', err);
      alert('Не удалось создать категорию');
    }
  };

  const categoryMatchesSearch = (category, search) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return category.name.toLowerCase().includes(searchLower);
  };

  const categoryOrChildrenMatch = (category, search) => {
    if (!search) return true;
    if (categoryMatchesSearch(category, search)) return true;
    if (category.children?.some(child => categoryOrChildrenMatch(child, search))) return true;
    return false;
  };

  const renderCategoryTree = (categories) => {
    return categories.map(cat => {
      if (searchText && !categoryOrChildrenMatch(cat, searchText)) {
        return null;
      }

      const hasChildren = cat.children?.length > 0;
      const isExpanded = expanded.has(cat.id);
      const shouldExpand = searchText && cat.children?.some(child => categoryOrChildrenMatch(child, searchText));

      return (
        <div key={cat.id} className="ml-3">
          <div className="flex items-center justify-between py-1 px-1">
            <div
              className="flex items-center flex-1"
              onContextMenu={(e) => handleContextMenu(e, cat)}
            >
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
              <label className="flex items-center cursor-pointer ml-1 flex-1 min-w-0">
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
            <button
              type="button"
              onClick={(e) => handleContextMenu(e, cat)}
              className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
              aria-label="Действия"
            >
              ⋯
            </button>
          </div>
          {hasChildren && (isExpanded || shouldExpand) && (
            <div className="ml-3">
              {renderCategoryTree(cat.children)}
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
  };

  const handleSelect = () => {
    onSelect(selectedId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 max-h-[80vh] flex flex-col">
        {mode === 'select' ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Выберите категорию</h3>

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

            <div
              className="border rounded p-2 max-h-60 overflow-y-auto mb-4"
              onClick={closeContextMenu}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div
                  className="flex items-center flex-1"
                  onContextMenu={(e) => handleContextMenu(e, null)}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="select-category"
                      checked={selectedId === null}
                      onChange={() => setSelectedId(null)}
                      className="mr-2"
                    />
                    <span>Номенклатура (без категории)</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleContextMenu(e, null)}
                  className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  aria-label="Действия"
                >
                  ⋯
                </button>
              </div>
              {renderCategoryTree(categoriesTree)}
            </div>

            <div className="flex justify-between space-x-2">
              <button
                onClick={handleAddClick}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Добавить
              </button>
              <div className="flex space-x-2">
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
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4">Добавить категорию</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Родительская категория
              </label>
              <div className="p-2 bg-gray-100 rounded text-sm">
                {createParentName}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя категории
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Введите название категории"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory();
                }}
              />
            </div>

            <div className="flex justify-between space-x-2">
              <button
                onClick={() => {
                  setMode('select');
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Назад
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={isCreating}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isCreating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </>
        )}
      </div>

      {contextMenu && mode === 'select' && (
        <div
          className="fixed z-[60] bg-white border rounded shadow-lg py-1 min-w-[160px] text-sm"
          style={{
            top: contextMenu.y,
            left: Math.min(contextMenu.x, window.innerWidth - 170),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full text-left px-3 py-1.5 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              handleAddSubcategoryFromMenu();
            }}
          >
            {contextMenu.category ? 'Добавить подкатегорию' : 'Добавить категорию'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelectModal;
