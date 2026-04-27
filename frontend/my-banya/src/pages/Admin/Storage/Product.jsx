// src/pages/Admin/Storage/Product.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useUploadProductPhotosMutation,
  useGetUnitsOfMeasurementQuery, // ← ДОБАВЛЕНО
} from '../../../redux/slices/productsApiSlice';
import CategorySelectModal from './CategorySelectModal';

function Product() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const productId = Number(id);
  const isEditing = !isNaN(productId) && productId > 0;

  const fromPath = location.state?.from || '/admin/storage/nomenclature';

  // Запросы
  const { data: product, isLoading: isLoadingProduct, isError: isErrorProduct } = useGetProductByIdQuery(productId, { skip: !isEditing });
  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: units = [], isLoading: isLoadingUnits } = useGetUnitsOfMeasurementQuery(); // ← ДОБАВЛЕНО
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [uploadPhotos, { isLoading: isUploadingPhotos }] = useUploadProductPhotosMutation();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: null,
    total_quantity: 0,
    last_purchase_price: 0.0,
    min_stock: 0.0,
    unit_id: null, // ← ДОБАВЛЕНО
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [tempImagePreviews, setTempImagePreviews] = useState([]);

  // Загрузка данных при редактировании
  useEffect(() => {
    if (isEditing && product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || null,
        total_quantity: product.total_quantity || 0,
        last_purchase_price: product.last_purchase_price || 0.0,
        min_stock: product.min_stock || 0.0,
        unit_id: product.unit_id || null, // ← ДОБАВЛЕНО
      });
      // Устанавливаем превью существующих фото
      if (product.photos?.length) {
        // Для фото используем базовый URL сервера (без /api)
        const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');
        const fullUrls = product.photos.map(photo => {
          const url = photo.image_url;
          return url.startsWith('/')
            ? `${baseUrl}${url}`
            : `${baseUrl}/${url}`;
        });
        setTempImagePreviews(fullUrls);
      }
    }
  }, [isEditing, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'total_quantity' || name === 'last_purchase_price'
        ? parseFloat(value) || 0
        : name === 'unit_id'
        ? (value === '' ? null : Number(value))
        : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = tempImagePreviews.length + files.length;

    if (totalImages > 5) {
      alert('Можно загрузить не более 5 изображений');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setTempImagePreviews(prev => [...prev, ...newPreviews]);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (indexToRemove) => {
    setTempImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCategorySelect = (categoryId) => {
    setForm(prev => ({ ...prev, category_id: categoryId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, category_id, total_quantity, last_purchase_price, min_stock, unit_id } = form;

    try {
      // Сначала обновляем основные данные товара
      const productData = {
        id: productId,
        name: name.trim(),
        description: description.trim(),
        category_id: category_id !== null ? parseInt(category_id) : null,
        total_quantity: total_quantity,
        last_purchase_price: last_purchase_price,
        min_stock: min_stock,
        unit_id: unit_id, // ← ДОБАВЛЕНО
      };

      await updateProduct(productData).unwrap();

      // Затем загружаем новые фото (если есть)
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => {
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

  const selectedCategory = categories.find(c => c.id == form.category_id);
  const selectedUnit = units.find(u => u.id === form.unit_id);

  if (isLoadingProduct || isLoadingCategories || isLoadingUnits) { // ← ДОБАВЛЕНО isLoadingUnits
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
            {/* Название */}
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

            {/* Описание */}
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

            {/* Единица измерения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Единица измерения</label>
              <select
                name="unit_id"
                value={form.unit_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не выбрана</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} — {unit.description || unit.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Фотографии */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фотографии (макс. 5)
              </label>

              {/* Сетка изображений */}
              {(tempImagePreviews.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {tempImagePreviews.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        title="Удалить фото"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Кнопка загрузки (только если < 5) */}
              {tempImagePreviews.length < 5 && (
                <label className="block w-full px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-600 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition">
                  <span>Выберите файлы или перетащите сюда</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    title={`Можно выбрать до ${5 - tempImagePreviews.length} изображений`}
                  />
                </label>
              )}

              <p className="text-xs text-gray-500 mt-1">
                Поддерживаются JPG, PNG. Максимум 5 изображений.
              </p>
            </div>

            {/* Категория */}
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

            {/* Минимальный остаток */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Остаток — ТОЛЬКО ПРОСМОТР */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Остаток ({selectedUnit?.name || 'шт.'})
                </label>
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
                  {product?.total_quantity || 0}
                </div>
              </div>
            )}

            {/* Цена закупки — ТОЛЬКО ПРОСМОТР */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена закупки (₽)</label>
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
                  {(product?.last_purchase_price || 0).toFixed(2)}
                </div>
              </div>
            )}

            {/* Кнопки */}
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
    </div>
  );
}

export default Product;