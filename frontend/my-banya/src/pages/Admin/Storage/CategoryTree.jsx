// src/pages/Admin/Storage/CategoryTree.jsx
import React, { useState, useCallback } from 'react';
import {
  useUpdateCategoryMutation,
  useUploadCategoryPhotosMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../redux/slices/productsApiSlice';
import CategoryModal from './CategoryModal';

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const CategoryTree = ({
  categoriesTree,
  expandedCategories,
  selectedCategoryPath,
  toggleCategory,
  selectCategory,
  onCategoriesChange,
  onAddProduct,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [uploadCategoryPhotos] = useUploadCategoryPhotosMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const extractApiErrorMessage = (err, fallback) => {
    const details = err?.data?.detail;
    if (typeof details === 'string') return details;
    if (Array.isArray(details) && details.length > 0) {
      const first = details[0];
      if (typeof first === 'string') return first;
      if (typeof first?.msg === 'string') return first.msg;
    }
    return fallback;
  };

  const handleContextMenu = useCallback((e, category) => {
    e.preventDefault();
    e.stopPropagation();
    const isTouch = e.type === 'click' || window.matchMedia('(max-width: 1023px)').matches;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      category,
      sheet: isTouch,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  React.useEffect(() => {
    if (!contextMenu || contextMenu.sheet) return undefined;
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu, closeContextMenu]);

  const openCategory = (category, currentPath) => {
    selectCategory(currentPath);
    if (category.children?.length > 0 && !expandedCategories.has(category.id)) {
      toggleCategory(category.id);
    }
  };

  const renderCategoryTree = (categories, path = []) => {
    return categories.map((category) => {
      const currentPath = [...path, { id: category.id, name: category.name }];
      const hasChildren = category.children?.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const isSelected =
        selectedCategoryPath.length === currentPath.length &&
        selectedCategoryPath.every((cat, index) => cat.id === currentPath[index].id);
      const depth = path.length;

      return (
        <div key={category.id}>
          <div
            className={`group flex items-center gap-0.5 rounded-xl min-h-[44px] pr-1 transition-colors ${
              isSelected
                ? 'bg-blue-50 ring-1 ring-blue-200'
                : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 text-gray-600 hover:bg-white/80"
                aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
              >
                <ChevronIcon open={isExpanded} />
              </button>
            ) : (
              <span className="w-9 h-9 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              </span>
            )}

            <button
              type="button"
              onClick={() => openCategory(category, currentPath)}
              onContextMenu={(e) => handleContextMenu(e, category)}
              className="flex-1 min-w-0 text-left py-2.5 pr-1"
            >
              <span
                className={`block truncate text-[15px] ${
                  isSelected ? 'text-blue-800 font-semibold' : 'text-gray-800 font-medium'
                }`}
              >
                {category.name}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleContextMenu(e, category)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Действия"
            >
              <span className="text-xl leading-none">⋯</span>
            </button>
          </div>

          {hasChildren && (
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden min-h-0">
                {renderCategoryTree(category.children, currentPath)}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const handleAddProductToRoot = () => {
    const category =
      selectedCategoryPath.length > 0
        ? selectedCategoryPath[selectedCategoryPath.length - 1]
        : null;
    onAddProduct?.(category);
  };

  const handleAddRootCategory = () => {
    setIsModalOpen(true);
    setEditCategory(null);
  };

  const handleModalSubmit = async (data) => {
    const { id, name, description, parent_id, is_visible_on_website, imageFiles, deletePhoto } = data;

    try {
      let categoryId;

      if (id) {
        await updateCategory({ id, name, description, parent_id, is_visible_on_website }).unwrap();
        categoryId = id;
      } else {
        const result = await createCategory({
          name,
          description,
          parent_id,
          is_visible_on_website,
        }).unwrap();
        categoryId = result.id;
      }

      if (deletePhoto) {
        await uploadCategoryPhotos({ categoryId, formData: new FormData() }).unwrap();
      } else if (imageFiles?.length) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append('files', file));
        await uploadCategoryPhotos({ categoryId, formData }).unwrap();
      }

      onCategoriesChange();
    } catch (err) {
      console.error('Ошибка:', err);
      alert(
        extractApiErrorMessage(
          err,
          id ? 'Не удалось обновить категорию' : 'Не удалось создать категорию'
        )
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id).unwrap();
        onCategoriesChange();
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Не удалось удалить категорию');
      }
    }
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const rootSelected = selectedCategoryPath.length === 0;

  const menuActions = contextMenu && (
    <>
      <button
        type="button"
        className="block w-full text-left px-4 py-3 sm:px-3 sm:py-2 hover:bg-gray-50 text-[15px] sm:text-sm font-medium text-gray-900 rounded-xl sm:rounded-none"
        onClick={(e) => {
          e.stopPropagation();
          closeContextMenu();
          onAddProduct?.(contextMenu.category);
        }}
      >
        Добавить товар
      </button>
      <button
        type="button"
        className="block w-full text-left px-4 py-3 sm:px-3 sm:py-2 hover:bg-gray-50 text-[15px] sm:text-sm font-medium text-gray-900 rounded-xl sm:rounded-none"
        onClick={(e) => {
          e.stopPropagation();
          setEditCategory(contextMenu.category);
          setIsModalOpen(true);
          closeContextMenu();
        }}
      >
        Редактировать
      </button>
      <button
        type="button"
        className="block w-full text-left px-4 py-3 sm:px-3 sm:py-2 text-red-600 hover:bg-red-50 text-[15px] sm:text-sm font-medium rounded-xl sm:rounded-none"
        onClick={() => {
          setCategoryToDelete(contextMenu.category);
          setIsDeleteModalOpen(true);
          closeContextMenu();
        }}
      >
        Удалить
      </button>
    </>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[min(70vh,36rem)] lg:max-h-[calc(100vh-4rem)]">
      <div className="shrink-0 px-3 pt-3 pb-2 sm:px-4 sm:pt-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Категории
          </h2>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleAddProductToRoot}
              className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg"
            >
              Товар +
            </button>
            <button
              type="button"
              onClick={handleAddRootCategory}
              className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg"
            >
              Категория +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => selectCategory([])}
          className={`w-full flex items-center gap-3 min-h-[44px] px-3 rounded-xl text-left transition-colors ${
            rootSelected
              ? 'bg-blue-50 ring-1 ring-blue-200 text-blue-800'
              : 'text-gray-800 hover:bg-gray-50'
          }`}
          title="Показать все товары"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              rootSelected ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
          <span className={`truncate text-[15px] ${rootSelected ? 'font-semibold' : 'font-medium'}`}>
            Все товары
          </span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-2 py-2 space-y-0.5">
        {categoriesTree?.length ? (
          renderCategoryTree(categoriesTree)
        ) : (
          <p className="px-3 py-6 text-sm text-gray-500 text-center">Категорий пока нет</p>
        )}
      </div>

      {contextMenu && !contextMenu.sheet && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] text-sm overflow-hidden"
          style={{
            top: contextMenu.y,
            left: Math.min(contextMenu.x, window.innerWidth - 180),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {menuActions}
        </div>
      )}

      {contextMenu?.sheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Закрыть"
            onClick={closeContextMenu}
          />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1">
            <div className="sm:hidden flex justify-center pt-1 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <p className="px-4 pb-1 text-sm text-gray-500 truncate">{contextMenu.category.name}</p>
            {menuActions}
            <button
              type="button"
              className="w-full px-4 py-3 text-gray-600 text-[15px]"
              onClick={closeContextMenu}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditCategory(null);
        }}
        onSubmit={handleModalSubmit}
        category={editCategory}
        categoriesTree={categoriesTree}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Подтвердите удаление</h3>
            <p className="text-sm text-gray-600">
              Удалить категорию «{categoryToDelete?.name}»?
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="min-h-[40px] px-4 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[40px] px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTree;
