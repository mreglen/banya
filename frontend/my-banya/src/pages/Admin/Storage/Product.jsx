// src/pages/Admin/Storage/Product.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useUploadProductPhotosMutation,
  useDeleteProductPhotoMutation,
  useGetUnitsOfMeasurementQuery,
} from '../../../redux/slices/productsApiSlice';
import CategorySelectModal from './CategorySelectModal';
import { prepareImageForUpload } from '../../../utils/imageProcessing';
import { isVideoFile, isVideoUrl } from '../../../utils/mediaHelpers';
import UnitCreateModal from './UnitCreateModal';
const ADD_UNIT_OPTION_VALUE = '__add_unit__';

const findCategoryById = (categories, categoryId) => {
  if (categoryId == null) return null;
  for (const cat of categories) {
    if (cat.id === categoryId) return cat;
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, categoryId);
      if (found) return found;
    }
  }
  return null;
};

function Product() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const productId = Number(id);
  const isEditing = !isNaN(productId) && productId > 0;

  const fromPath = location.state?.from || '/admin/storage/nomenclature';

  const { data: product, isLoading: isLoadingProduct, isError: isErrorProduct } = useGetProductByIdQuery(productId, { skip: !isEditing });
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: units = [], isLoading: isLoadingUnits, refetch: refetchUnits } = useGetUnitsOfMeasurementQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [uploadPhotos, { isLoading: isUploadingPhotos }] = useUploadProductPhotosMutation();
  const [deleteProductPhoto] = useDeleteProductPhotoMutation();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: null,
    total_quantity: 0,
    price: '',
    is_countable: true,
    min_stock: 0.0,
    unit_id: null,
    is_visible_on_website: true,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const SERVER_BASE_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : (window.location.origin || 'http://127.0.0.1:8000');

  useEffect(() => {
    if (isEditing && product) {
      const selectedCat = findCategoryById(categories, product.category_id);
      const categoryVisible = Boolean(selectedCat?.is_visible_on_website);
      setForm({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || null,
        total_quantity: product.total_quantity || 0,
        price: (product.price ?? 0).toString(),
        is_countable: product.is_countable ?? true,
        min_stock: product.min_stock || 0.0,
        unit_id: product.unit_id || null,
        is_visible_on_website: categoryVisible
          ? (product.is_visible_on_website ?? true)
          : false,
      });
      if (product.photos?.length) {
        setExistingImages(
          product.photos.map((photo) => ({
            photoId: photo.photo_id,
            url: photo.image_url.startsWith('/')
              ? `${SERVER_BASE_URL}${photo.image_url}`
              : `${SERVER_BASE_URL}/${photo.image_url}`,
            isVideo: isVideoUrl(photo.image_url),
          }))
        );
      } else {
        setExistingImages([]);
      }
      newImages.forEach((item) => URL.revokeObjectURL(item.preview));
      setNewImages([]);
    }
  }, [isEditing, product, categories]);

  useEffect(() => {
    return () => {
      newImages.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [newImages]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'total_quantity'
        ? parseFloat(value) || 0
        : name === 'price'
        ? (value === '' || /^\d*$/.test(value) ? value : prev.price)
        : name === 'unit_id'
        ? (value === '' ? null : Number(value))
        : value
    }));
  };

  const processFiles = async (files) => {
    if (!files.length) return;

    try {
      const processed = await Promise.all(
        files.map(async (file) => {
          if (isVideoFile(file)) {
            return {
              file,
              preview: URL.createObjectURL(file),
              isVideo: true,
            };
          }

          const preparedFile = await prepareImageForUpload(file);
          return {
            file: preparedFile,
            preview: URL.createObjectURL(preparedFile),
            isVideo: false,
          };
        })
      );
      setNewImages((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Ошибка обработки файлов товара:', err);
      alert(err.message || 'Не удалось подготовить файлы');
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    await processFiles(files);
  };

  const removeExistingImage = async (indexToRemove) => {
    const image = existingImages[indexToRemove];
    if (!image) return;

    if (image.photoId) {
      try {
        await deleteProductPhoto({ productId, photoId: image.photoId }).unwrap();
      } catch (err) {
        console.error('Ошибка удаления фото:', err);
        alert('Не удалось удалить файл');
        return;
      }
    }

    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeNewImage = (indexToRemove) => {
    setNewImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[indexToRemove].preview);
      updated.splice(indexToRemove, 1);
      return updated;
    });
  };

  const handleCategorySelect = (categoryId) => {
    setForm((prev) => {
      const cat = categoryId != null ? findCategoryById(categories, categoryId) : null;
      const visible = Boolean(cat?.is_visible_on_website);
      return {
        ...prev,
        category_id: categoryId,
        is_visible_on_website: visible ? true : false,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, category_id, is_countable, min_stock, unit_id, price, is_visible_on_website } = form;

    try {
      const selectedCat = findCategoryById(categories, category_id);
      const visibleCategory = Boolean(selectedCat?.is_visible_on_website);
      const productData = {
        id: productId,
        name: name.trim(),
        description: description.trim(),
        category_id: category_id !== null ? parseInt(category_id) : null,
        is_visible_on_website: visibleCategory ? Boolean(is_visible_on_website) : false,
        is_countable: is_countable,
        min_stock: is_countable ? min_stock : 0,
        unit_id: unit_id,
        price: price === '' ? 0 : Number(price),
      };

      await updateProduct(productData).unwrap();

      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(({ file }) => {
          formData.append('files', file);
        });
        await uploadPhotos({ productId, formData }).unwrap();
      }

      navigate(fromPath);
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка при сохранении товара');
    }
  };

  const selectedCategory = findCategoryById(categories, form.category_id);
  const categoryVisibleOnWebsite = Boolean(selectedCategory?.is_visible_on_website);
  const selectedUnit = units.find(u => u.id === form.unit_id);

  if (isLoadingProduct || isLoadingCategories || isLoadingUnits) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  if (isErrorProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Товар не найден
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Карточка товара' : 'Новый товар'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Название *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Единица измерения</label>
              <select
                name="unit_id"
                value={form.unit_id || ''}
                onChange={(e) => {
                  if (e.target.value === ADD_UNIT_OPTION_VALUE) {
                    setIsUnitModalOpen(true);
                    return;
                  }
                  handleChange(e);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не выбрана</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} — {unit.description || unit.name}
                  </option>
                ))}
                <option value={ADD_UNIT_OPTION_VALUE}>+ Добавить единицу измерения</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фотографии и видео
              </label>

              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {existingImages.map((item, index) => (
                    <div key={`existing-${item.photoId || index}`} className="relative group">
                      {item.isVideo ? (
                        <video
                          src={item.url}
                          className="w-full h-24 object-cover rounded-lg border bg-black"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={`Медиа ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {newImages.map((item, index) => (
                    <div key={`new-${index}`} className="relative group">
                      {item.isVideo ? (
                        <video
                          src={item.preview}
                          className="w-full h-24 object-cover rounded-lg border bg-black"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.preview}
                          alt={`Новое медиа ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`block w-full px-4 py-3 bg-white border-2 border-dashed rounded-xl text-center text-gray-600 cursor-pointer transition ${
                  isDragging
                    ? 'border-blue-500 text-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                <span>Выберите файлы или перетащите сюда</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <p className="text-xs text-gray-500 mt-1">
                Поддерживаются изображения и видео.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория *</label>
              <div className="flex items-center">
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
                  {form.category_id === null || form.category_id === ''
                    ? 'Не выбрана'
                    : selectedCategory?.name || 'Загрузка...'}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="ml-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Выбрать
                </button>
              </div>
            </div>

            {categoryVisibleOnWebsite && (
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_visible_on_website}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_visible_on_website: e.target.checked }))
                    }
                  />
                  <span>Отображать на сайте</span>
                </label>
              </div>
            )}

            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!form.is_countable}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, is_countable: !e.target.checked }))
                  }
                />
                <span>Не исчисляемый товар</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимальный остаток ({selectedUnit?.name || 'шт.'})
              </label>
              <input
                type="number"
                name="min_stock"
                value={form.min_stock}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={!form.is_countable}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isEditing && form.is_countable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Остаток ({selectedUnit?.name || 'шт.'})
                </label>
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
                  {product?.total_quantity || 0}
                </div>
              </div>
            )}

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена закупки (₽)</label>
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
                  {(product?.last_purchase_price || 0).toFixed(2)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
              <input
                type="text"
                name="price"
                value={form.price}
                inputMode="numeric"
                onChange={handleChange}
                onBlur={() => {
                  setForm((prev) => {
                    if (prev.price === '') return prev;
                    return { ...prev, price: String(Number(prev.price)) };
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Рассчитывается автоматически: закупочная × (1 + наценка %). При ручном изменении не пересчитывается автоматически, пока не придёт новое поступление или не измените наценку в настройках.
              </p>
              {isEditing && product?.is_price_manual && (
                <p className="text-xs text-amber-700 mt-1 font-medium">Ручное значение</p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isUpdating || isUploadingPhotos}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow transition disabled:opacity-50"
              >
                {isUpdating || isUploadingPhotos ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => navigate(fromPath)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium shadow transition"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
      <CategorySelectModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={handleCategorySelect}
        categoriesTree={categories}
        currentCategoryId={form.category_id}
      />
      <UnitCreateModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onCreated={async (unit) => {
          await refetchUnits();
          setForm((prev) => ({ ...prev, unit_id: unit?.id ?? prev.unit_id }));
        }}
      />
    </div>
  );
}

export default Product;
