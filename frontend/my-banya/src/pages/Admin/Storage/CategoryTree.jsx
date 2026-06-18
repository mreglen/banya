// src/pages/Admin/Storage/CategoryTree.jsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUpdateCategoryMutation,
  useUploadCategoryPhotosMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../../redux/slices/productsApiSlice';
import CategoryModal from './CategoryModal';

const CategoryTree = ({
  categoriesTree,
  expandedCategories,
  selectedCategoryPath,
  toggleCategory,
  selectCategory,
  onCategoriesChange, // callback для обновления дерева
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const navigate = useNavigate();
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
    setContextMenu({ x: e.clientX, y: e.clientY, category });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('click', handleClick);
    }
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [contextMenu, closeContextMenu]);

  const renderCategoryTree = (categories, level = 0, path = [], isModalMode = false) => {
    return categories.map(category => {
      const currentPath = [...path, { id: category.id, name: category.name }];
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategoryPath.length === currentPath.length &&
        selectedCategoryPath.every((cat, index) => cat.id === currentPath[index].id);

      const handleClick = (e) => {
        e.stopPropagation();
        if (isModalMode) {
          // В модалке выбор родителя — не используется в новом подходе
        } else {
          selectCategory(currentPath);
        }
      };

      const handleRightClick = (e) => {
        if (!isModalMode) {
          handleContextMenu(e, category);
        }
      };

      const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (category.children?.length > 0) {
          toggleCategory(category.id);
        }
      };

      return (
        <div key={category.id} className="ml-3">
          <div className="flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-gray-100 rounded">
            <div
              className={`flex items-center truncate flex-1 ${isSelected && !isModalMode ? 'bg-blue-100 -mx-2 px-2 py-1 rounded' : ''}`}
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleRightClick}
            >
              {category.children?.length > 0 ? (
                <span className="mr-1 flex-shrink-0">{isExpanded ? '▼' : '►'}</span>
              ) : (
                <span className="mr-1 text-gray-500 flex-shrink-0">•</span>
              )}
              <span className="truncate">{category.name}</span>
            </div>

            {/* Кнопка меню (видна всегда, включая мобильные) */}
            {!isModalMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, category);
                }}
                className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                aria-label="Действия"
              >
                ⋯
              </button>
            )}
          </div>
          {isExpanded && category.children?.length > 0 && (
            <div className="ml-3">
              {renderCategoryTree(category.children, level + 1, currentPath, isModalMode)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleAddProductToRoot = () => {
    const rootCategory = { id: null, name: 'Номенклатура' };
    navigate('/admin/storage/nomenclature/add/product', { state: { category: rootCategory } });
  };

  const handleAddRootCategory = () => {
    setIsModalOpen(true);
    setEditCategory(null);
  };

  const handleModalSubmit = async (data) => {
    const { id, name, description, parent_id, is_visible_on_website, imageFiles, deletePhoto } = data;

    console.log('Submitting category update:', { id, name, parent_id, is_visible_on_website });

    try {
      let categoryId;

      if (id) {
        // Редактирование
        console.log('Updating category with data:', { id, name, parent_id, is_visible_on_website });
        await updateCategory({ id, name, description, parent_id, is_visible_on_website }).unwrap();
        categoryId = id;
      } else {
        // Создание
        const result = await createCategory({ name, description, parent_id, is_visible_on_website }).unwrap();
        categoryId = result.id;
      }

      // Удаление или загрузка фото
      if (deletePhoto) {
        // Удаляем фото
        await uploadCategoryPhotos({ categoryId, formData: new FormData() }).unwrap();
      } else if (imageFiles?.length) {
        // Загружаем новые фото
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append('files', file));
        await uploadCategoryPhotos({ categoryId, formData }).unwrap();
      }

      onCategoriesChange();
    } catch (err) {
      console.error('Ошибка:', err);
      alert(extractApiErrorMessage(err, id ? 'Не удалось обновить категорию' : 'Не удалось создать категорию'));
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

  return (
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <button
          onClick={() => selectCategory([])}
          className={`text-base font-semibold ${selectedCategoryPath.length === 0 ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'}`}
          title="Показать всю номенклатуру"
        >
          Номенклатура
        </button>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={handleAddProductToRoot}
            className="px-2 py-1 text-xs sm:text-sm text-green-600 hover:text-green-800 border border-green-600 rounded flex items-center"
          >
            Товар +
          </button>
          <button
            onClick={handleAddRootCategory}
            className="px-2 py-1 text-xs sm:text-sm text-blue-500 hover:text-blue-700 border border-blue-500 rounded flex items-center"
          >
            Категория +
          </button>
        </div>
      </div>

      <div
        className="space-y-1 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto text-sm"
        onClick={closeContextMenu}
      >
        {renderCategoryTree(categoriesTree)}
      </div>

      {/* Контекстное меню — не меняем логику */}
      {/* Контекстное меню — адаптивная позиция */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border rounded shadow-lg py-1 min-w-[140px] text-sm"
          style={{
            top: contextMenu.y,
            left: Math.min(contextMenu.x, window.innerWidth - 160), // 160 ≈ ширина меню + отступ
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left px-3 py-1.5 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              closeContextMenu();
              navigate('/admin/storage/nomenclature/add/product', {
                state: { category: contextMenu.category }
              });
            }}
          >
            Добавить товар
          </button>
          <button
            className="block w-full text-left px-3 py-1.5 hover:bg-gray-100"
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
            className="block w-full text-left px-3 py-1.5 text-red-600 hover:bg-gray-100"
            onClick={() => {
              setCategoryToDelete(contextMenu.category);
              setIsDeleteModalOpen(true);
              closeContextMenu();
            }}
          >
            Удалить
          </button>
        </div>
      )}

      {/* Модалки — без изменений */}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Подтвердите удаление</h3>
            <p className="text-sm">Вы уверены, что хотите удалить категорию "{categoryToDelete?.name}"?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-sm bg-gray-300 rounded hover:bg-gray-400"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
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