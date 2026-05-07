// src/components/CategoryModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { prepareImageForUpload, MAX_IMAGE_SIZE_MB } from '../../../utils/imageProcessing';

const CategoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  category = null,
  categoriesTree,
}) => {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoDeleted, setPhotoDeleted] = useState(false);
  const [isVisibleOnWebsite, setIsVisibleOnWebsite] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const fileInputRef = useRef(null);

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

  const renderCategoryTree = (categories) => {
    return categories.map(cat => {
      const hasChildren = cat.children?.length > 0;
      const isExpanded = expanded.has(cat.id);

      return (
        <div key={cat.id} className="ml-3">
          <div className="flex items-center py-1 px-1">
            {hasChildren ? (
              <span
                className="mr-1 cursor-pointer select-none text-sm"
                onClick={() => toggleExpand(cat.id)}
              >
                {isExpanded ? '▼' : '►'}
              </span>
            ) : (
              <span className="mr-1 text-gray-500 text-sm">•</span>
            )}
            <label className="flex items-center cursor-pointer ml-1">
              <input
                type="radio"
                name="parent-category"
                checked={selectedParentId === cat.id}
                onChange={() => setSelectedParentId(cat.id)}
                className="mr-2"
              />
              <span className="truncate text-sm">{cat.name}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-3">
              {renderCategoryTree(cat.children)}
            </div>
          )}
        </div>
      );
    });
  };

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setSelectedParentId(category?.parent_id ?? null);
      setIsVisibleOnWebsite(Boolean(category?.is_visible_on_website));
      setImageFile(null);
      setPreviewUrl(null);
      setPhotoDeleted(false);

      // Для фото используем базовый URL сервера (без /api)
      const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');
      const imageUrl = category?.photos?.[0]?.image_url;
      const cleanImageUrl = imageUrl?.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      setCurrentImageUrl(cleanImageUrl ? `${baseUrl}/${cleanImageUrl}` : null);

      setExpanded(new Set());
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, category]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDeletePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl(null);
    setPhotoDeleted(true);
    setCurrentImageUrl(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Можно загрузить только изображение');
      e.target.value = '';
      return;
    }

    try {
      const preparedFile = await prepareImageForUpload(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreview = URL.createObjectURL(preparedFile);
      setImageFile(preparedFile);
      setPreviewUrl(newPreview);
      setPhotoDeleted(false);
    } catch (err) {
      console.error('Ошибка обработки изображения категории:', err);
      alert(err.message || `Не удалось подготовить фото. Максимум ${MAX_IMAGE_SIZE_MB} МБ`);
      setImageFile(null);
      setPreviewUrl(null);
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Имя категории не может быть пустым');
      return;
    }
    onSubmit({
      id: category?.id,
      name,
      parent_id: selectedParentId,
      is_visible_on_website: isVisibleOnWebsite,
      imageFile,
      deletePhoto: photoDeleted,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">
            {category ? 'Редактировать категорию' : 'Добавить категорию'}
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя категории</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="Название категории"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Родительская категория</label>
            <div className="border rounded p-2 max-h-40 overflow-y-auto text-sm">
              <label className="flex items-center cursor-pointer mb-2 px-1">
                <input
                  type="radio"
                  name="parent-category"
                  checked={selectedParentId === null}
                  onChange={() => setSelectedParentId(null)}
                  className="mr-2"
                />
                <span>Номенклатура</span>
              </label>
              {renderCategoryTree(categoriesTree)}
            </div>
          </div>

          <div className="mb-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isVisibleOnWebsite}
                onChange={(e) => setIsVisibleOnWebsite(e.target.checked)}
              />
              <span>Отображать категорию на сайте</span>
            </label>
          </div>

          {/* Превью фото */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Изображение
            </label>
            {(imageFile || (currentImageUrl && !photoDeleted)) && (
              <div className="relative inline-block">
                {imageFile ? (
                  <img
                    src={previewUrl}
                    alt="Новое фото"
                    className="h-20 sm:h-24 object-contain border rounded"
                  />
                ) : (
                  <img
                    src={currentImageUrl}
                    alt="Текущее фото"
                    className="h-20 sm:h-24 object-contain border rounded"
                  />
                )}
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs shadow"
                  title="Удалить фото"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {currentImageUrl && !photoDeleted ? 'Заменить изображение' : 'Добавить изображение'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">Загружается только 1 фото, максимум {MAX_IMAGE_SIZE_MB} МБ после сжатия.</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-center text-sm bg-gray-300 rounded hover:bg-gray-400"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 py-2 text-center text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {category ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;