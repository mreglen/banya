// src/pages/Admin/Services/AddProduct.js
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addItem } from '../../../redux/slices/documentEntranceFormSlice';
import { toast } from 'react-hot-toast';

function AddProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [tempImagePreviews, setTempImagePreviews] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // --- СТАТИЧЕСКИЕ ДАННЫЕ ИЗ localStorage ---
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const storedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
      setCategories(storedCategories);
    } catch (err) {
      setError('Ошибка загрузки категорий');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fromDocument = location.state?.fromDocument;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setTempImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setTempImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const saveProductToStorage = (product) => {
    const stored = JSON.parse(localStorage.getItem('products') || '[]');
    const newId = stored.length ? Math.max(...stored.map(p => p.product_id)) + 1 : 1;
    product.product_id = newId;
    stored.push(product);
    localStorage.setItem('products', JSON.stringify(stored));
    return product;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Пожалуйста, введите название товара');
      return;
    }
    if (!cost) {
      toast.error('Пожалуйста, укажите цену');
      return;
    }
    if (!selectedCategoryId) {
      toast.error('Пожалуйста, выберите категорию');
      return;
    }

    try {
      const numCost = parseFloat(cost);
      if (isNaN(numCost) || numCost < 0) {
        toast.error('Укажите корректную цену');
        return;
      }

      const newProductData = {
        name: name.trim(),
        description: description.trim(),
        cost: numCost,
        category_id: selectedCategoryId || null,
        subcategory_id: selectedSubcategoryId || null,
        images: tempImagePreviews,
      };

      const savedProduct = saveProductToStorage(newProductData);
      const productId = savedProduct.product_id;

      toast.success('Товар успешно добавлен!');

      if (fromDocument && fromDocument.returnTo) {
        const itemToAdd = {
          id: Date.now() + Math.random(),
          productId: productId,
          name: name.trim(),
          quantity: 1,
          purchasePrice: numCost,
        };

        dispatch(addItem(itemToAdd));
        navigate(fromDocument.returnTo);
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('Ошибка при добавлении товара:', err);
      toast.error('Ошибка при сохранении товара');
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка категорий...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Добавить товар</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Фотографии</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {tempImagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {tempImagePreviews.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
            <div className="flex items-center">
              <input
                type="text"
                value={selectedCategory ? selectedCategory.name : ''}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100"
                placeholder="Не выбрана"
              />
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="ml-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow transition"
              >
                Выбрать
              </button>
            </div>
          </div>

          {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Подкатегория</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={selectedSubcategoryId ? selectedCategory.subcategories.find(s => s.id === selectedSubcategoryId)?.name || '' : ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100"
                  placeholder="Не выбрана"
                />
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="ml-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow transition"
                  disabled={true}
                >
                  Выбрать
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow transition"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => {
                if (fromDocument && fromDocument.returnTo) {
                  navigate(fromDocument.returnTo);
                } else {
                  navigate(-1);
                }
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium shadow transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;