// src/pages/Admin/Storage/AddStorageProduct.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useCreateProductMutation,
  useUploadProductPhotosMutation,
  useGetCategoriesQuery,
  useGetUnitsOfMeasurementQuery,
} from '../../../redux/slices/productsApiSlice';
import CategorySelectModal from './CategorySelectModal';

const AddStorageProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryPath: null,
    unit_id: '',
    website_price: 0,
    is_countable: true,
  });

  const [images, setImages] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { data: categoriesTree = [] } = useGetCategoriesQuery();
  const { data: units = [], isLoading: isLoadingUnits } = useGetUnitsOfMeasurementQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [uploadProductPhotos, { isLoading: isUploading }] = useUploadProductPhotosMutation();

  useEffect(() => {
    if (location.state?.category) {
      setFormData(prev => ({ ...prev, categoryPath: location.state.category }));
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategorySelect = (categoryId) => {
    if (categoryId === null) {
      setFormData(prev => ({ ...prev, categoryPath: null }));
    } else {
      const findCategory = (cats, id) => {
        for (const cat of cats) {
          if (cat.id === id) return cat;
          if (cat.children?.length) {
            const found = findCategory(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const selectedCategory = findCategory(categoriesTree, categoryId);
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, categoryPath: selectedCategory }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Укажите наименование');

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (formData.categoryPath?.id !== undefined && formData.categoryPath.id !== null) {
        productData.category_id = Number(formData.categoryPath.id);
      } else {
        productData.category_id = null;
      }

      if (formData.unit_id !== '' && formData.unit_id !== null) {
        productData.unit_id = Number(formData.unit_id);
      } else {
        productData.unit_id = null;
      }

      productData.website_price = Number(formData.website_price) || 0;
      productData.is_countable = Boolean(formData.is_countable);

      const createdProduct = await createProduct(productData).unwrap();
      const productId = createdProduct.id;

      if (images.length > 0) {
        const formDataUpload = new FormData();
        images.forEach(file => {
          formDataUpload.append('files', file);
        });
        await uploadProductPhotos({ productId, formData: formDataUpload }).unwrap();
      }

      alert('Товар успешно создан');
      navigate('/admin/storage/nomenclature');
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось создать товар: ' + (err.data?.detail || 'Проверьте данные'));
    }
  };

  const categoryName = formData.categoryPath ? formData.categoryPath.name : 'не выбрана';
  const isLoading = isCreating || isUploading || isLoadingUnits;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Добавление товара</h1>
        <form onSubmit={handleSubmit}>
          {/* Категория */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded border">
              <span>{categoryName}</span>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Изменить
              </button>
            </div>
          </div>

          {/* Наименование */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Наименование *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          {/* Описание */}
          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Единица измерения */}
          <div className="mb-5">
            <label htmlFor="unit_id" className="block text-sm font-medium text-gray-700 mb-1">
              Единица измерения
            </label>
            {isLoadingUnits ? (
              <div className="w-full p-2 border border-gray-300 rounded bg-gray-100">Загрузка...</div>
            ) : (
              <select
                id="unit_id"
                name="unit_id"
                value={formData.unit_id ?? ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Не выбрана</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} — {unit.description || unit.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-5">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!formData.is_countable}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_countable: !e.target.checked }))
                }
              />
              <span>Не исчисляемый товар</span>
            </label>
          </div>

          <div className="mb-5">
            <label htmlFor="website_price" className="block text-sm font-medium text-gray-700 mb-1">
              Цена для сайта (₽)
            </label>
            <input
              type="text"
              id="website_price"
              name="website_price"
              value={formData.website_price ?? 0}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only digits and decimal point
                if (/^\d*\.?\d*$/.test(value) || value === '') {
                  setFormData(prev => ({ ...prev, website_price: value === '' ? 0 : value }));
                }
              }}
              onBlur={(e) => {
                // Convert to number on blur
                const value = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ ...prev, website_price: value }));
              }}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="0"
            />
          </div>

          {/* Фотографии */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Фотографии</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview ${index}`}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить товар'}
            </button>
          </div>
        </form>
      </div>

      <CategorySelectModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={handleCategorySelect}
        categoriesTree={categoriesTree}
        currentCategoryId={formData.categoryPath?.id || null}
      />
    </div>
  );
};

export default AddStorageProduct;