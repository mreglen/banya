// src/pages/Admin/Storage/CategorySelectModal.jsx
import React, { useState, useEffect } from 'react';
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
  const [sheetCategory, setSheetCategory] = useState(undefined); // undefined=closed, null=root, object=cat

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentCategoryId);
      setMode('select');
      setCreateParentId(null);
      setCreateParentName('Номенклатура');
      setNewCategoryName('');
      setSearchText('');
      setSheetCategory(undefined);
    }
  }, [isOpen, currentCategoryId]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateMode = (parentId, parentName) => {
    setCreateParentId(parentId);
    setCreateParentName(parentName);
    setNewCategoryName('');
    setMode('create');
    setSheetCategory(undefined);
  };

  const handleAddClick = () => {
    if (selectedId === null) {
      openCreateMode(null, 'Номенклатура');
    } else {
      const category = findCategoryById(categoriesTree, selectedId);
      openCreateMode(selectedId, category?.name || 'Номенклатура');
    }
  };

  const handleAddSubcategoryFromSheet = () => {
    if (sheetCategory) {
      openCreateMode(sheetCategory.id, sheetCategory.name);
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
        setExpanded((prev) => new Set([...prev, createParentId]));
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
    return category.name.toLowerCase().includes(search.toLowerCase());
  };

  const categoryOrChildrenMatch = (category, search) => {
    if (!search) return true;
    if (categoryMatchesSearch(category, search)) return true;
    if (category.children?.some((child) => categoryOrChildrenMatch(child, search))) return true;
    return false;
  };

  const renderCategoryTree = (categories, depth = 0) => {
    return categories
      .map((cat) => {
        if (searchText && !categoryOrChildrenMatch(cat, searchText)) {
          return null;
        }

        const hasChildren = cat.children?.length > 0;
        const isExpanded = expanded.has(cat.id);
        const shouldExpand =
          searchText && cat.children?.some((child) => categoryOrChildrenMatch(child, searchText));
        const open = isExpanded || shouldExpand;
        const selected = selectedId === cat.id;

        return (
          <div key={cat.id}>
            <div
              className={`flex items-center gap-1 rounded-xl min-h-[48px] px-2 ${
                selected ? 'bg-blue-50 ring-1 ring-blue-200' : 'active:bg-gray-50'
              }`}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(cat.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 shrink-0"
                  aria-label={open ? 'Свернуть' : 'Развернуть'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}

              <button
                type="button"
                onClick={() => setSelectedId(cat.id)}
                className="flex-1 min-w-0 flex items-center gap-3 py-2 text-left"
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {selected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </span>
                <span className="truncate text-[15px] text-gray-900 font-medium">{cat.name}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedId(cat.id);
                  setSheetCategory(cat);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 shrink-0"
                aria-label="Действия"
              >
                <span className="text-xl leading-none">⋯</span>
              </button>
            </div>

            {hasChildren && open && (
              <div>{renderCategoryTree(cat.children, depth + 1)}</div>
            )}
          </div>
        );
      })
      .filter(Boolean);
  };

  const handleSelect = () => {
    onSelect(selectedId);
    onClose();
  };

  if (!isOpen) return null;

  const rootSelected = selectedId === null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full sm:w-[min(100%,28rem)] sm:max-w-md
          h-[92dvh] sm:h-auto sm:max-h-[85vh]
          rounded-t-2xl sm:rounded-2xl shadow-xl
          flex flex-col overflow-hidden
          pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {mode === 'select' ? (
          <>
            <div className="px-4 pt-2 sm:pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Выберите категорию</h3>
              <div className="relative mt-3">
                <input
                  type="search"
                  placeholder="Поиск категории..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 bg-gray-100"
                    aria-label="Очистить"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2">
              <div
                className={`flex items-center gap-1 rounded-xl min-h-[48px] px-2 mb-1 ${
                  rootSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'active:bg-gray-50'
                }`}
              >
                <span className="w-10 shrink-0" />
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex-1 min-w-0 flex items-center gap-3 py-2 text-left"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      rootSelected ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {rootSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </span>
                  <span className="text-[15px] text-gray-900 font-medium">
                    Номенклатура (без категории)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setSheetCategory(null);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 shrink-0"
                  aria-label="Действия"
                >
                  <span className="text-xl leading-none">⋯</span>
                </button>
              </div>
              {renderCategoryTree(categoriesTree)}
            </div>

            <div className="shrink-0 border-t border-gray-100 p-3 sm:p-4 space-y-2 bg-white">
              <button
                type="button"
                onClick={handleSelect}
                className="w-full min-h-[48px] px-4 py-3 bg-blue-600 text-white rounded-xl font-medium text-base hover:bg-blue-700"
              >
                Выбрать
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="min-h-[44px] px-3 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700"
                >
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-3 py-2.5 bg-gray-100 text-gray-800 rounded-xl font-medium text-sm hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-4 pt-2 sm:pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Добавить категорию</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Родительская категория
                </label>
                <div className="p-3 bg-gray-100 rounded-xl text-sm text-gray-800">
                  {createParentName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя категории
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Введите название"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategory();
                  }}
                />
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-100 p-3 sm:p-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('select');
                  setNewCategoryName('');
                }}
                className="min-h-[48px] px-3 py-2.5 bg-gray-100 text-gray-800 rounded-xl font-medium"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isCreating}
                className="min-h-[48px] px-3 py-2.5 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isCreating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </>
        )}
      </div>

      {sheetCategory !== undefined && mode === 'select' && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Закрыть меню"
            onClick={() => setSheetCategory(undefined)}
          />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
            <div className="sm:hidden flex justify-center pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <p className="text-sm text-gray-500 px-1 pb-1">
              {sheetCategory ? sheetCategory.name : 'Номенклатура'}
            </p>
            <button
              type="button"
              className="w-full min-h-[48px] text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-[15px] font-medium text-gray-900"
              onClick={handleAddSubcategoryFromSheet}
            >
              {sheetCategory ? 'Добавить подкатегорию' : 'Добавить категорию'}
            </button>
            <button
              type="button"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-gray-600"
              onClick={() => setSheetCategory(undefined)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelectModal;
