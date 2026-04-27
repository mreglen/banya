import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetBathByIdQuery,
  useCreateBathMutation,
  useUpdateBathMutation,
  useUploadBathPhotosMutation,
  useDeleteBathPhotoMutation,
} from '../../../redux/slices/apiSlice';
import { useGetPromotionsQuery } from '../../../redux/slices/promotionsApiSlice';

function BathForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const bathId = isEditing ? parseInt(id) : null;

  // Для фото используем базовый URL сервера (без /api)
  const SERVER_BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');

  const { data: bath, isLoading: isLoadingBath } = useGetBathByIdQuery(bathId, { skip: !isEditing });
  const [createBath] = useCreateBathMutation();
  const [updateBath] = useUpdateBathMutation();
  const [uploadPhotos] = useUploadBathPhotosMutation();
  const [deletePhoto] = useDeleteBathPhotoMutation();
  const { data: promotions = [] } = useGetPromotionsQuery();

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    cost_weekday: '',
    cost_weekend: '',
    description: '',
    base_guests: 4,
    extra_guest_price: 500,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (bath) {
      setFormData({
        name: bath.name,
        title: bath.title,
        cost_weekday: bath.cost_weekday,
        cost_weekend: bath.cost_weekend,
        description: bath.description || '',
        base_guests: bath.base_guests || 4,
        extra_guest_price: bath.extra_guest_price || 500,
      });
      setSelectedPromotionIds(bath.promotions?.map(p => p.id) || []);
    }
  }, [bath]);

  // Очистка URL превью при размонтировании
  useEffect(() => {
    return () => {
      selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.title || !formData.cost_weekday || !formData.cost_weekend) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSaving(true);
    try {
      let resultBathId = bathId;

      if (isEditing) {
        // Обновляем существующую баню
        await updateBath({
          bath_id: bathId,
          name: formData.name,
          title: formData.title,
          cost_weekday: Number(formData.cost_weekday),
          cost_weekend: Number(formData.cost_weekend),
          description: formData.description || null,
          base_guests: Number(formData.base_guests),
          extra_guest_price: Number(formData.extra_guest_price),
          promotion_ids: selectedPromotionIds,
        }).unwrap();
      } else {
        // Создаем новую баню
        const result = await createBath({
          name: formData.name,
          title: formData.title,
          cost_weekday: Number(formData.cost_weekday),
          cost_weekend: Number(formData.cost_weekend),
          description: formData.description || null,
          base_guests: Number(formData.base_guests),
          extra_guest_price: Number(formData.extra_guest_price),
          photo_urls: [],
          promotion_ids: selectedPromotionIds,
        }).unwrap();
        resultBathId = result.bath_id;
      }

      // Загружаем фото если есть
      if (selectedFiles.length > 0 && resultBathId) {
        const filesToUpload = selectedFiles.map(item => item.file);
        await uploadPhotos({ bath_id: resultBathId, files: filesToUpload }).unwrap();
      }

      // Возвращаемся к списку
      navigate('/admin/baths');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Произошла ошибка при сохранении бани');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('Можно загрузить не более 5 фото');
      return;
    }
    
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removePreview = (index) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это фото?')) {
      return;
    }

    try {
      await deletePhoto({ bath_id: bathId, photo_id: photoId }).unwrap();
      // Refetch bath data to update the photos list
      window.location.reload();
    } catch (err) {
      console.error('Ошибка удаления фото:', err);
      alert('Произошла ошибка при удалении фото');
    }
  };

  if (isLoadingBath) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Редактировать баню' : 'Добавить новую баню'}
          </h1>
          <button
            onClick={() => navigate('/admin/baths')}
            className="text-green-600 hover:text-green-700 font-medium transition"
          >
            ← Назад к списку
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название бани *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="например: Кедровая"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="например: Кедровая парилка"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цена с пн-чт (₽) *
              </label>
              <input
                type="number"
                value={formData.cost_weekday}
                onChange={(e) => setFormData({ ...formData, cost_weekday: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="3000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цена с пт-вс (₽) *
              </label>
              <input
                type="number"
                value={formData.cost_weekend}
                onChange={(e) => setFormData({ ...formData, cost_weekend: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="3500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Базовое кол-во гостей *
              </label>
              <input
                type="number"
                value={formData.base_guests}
                onChange={(e) => setFormData({ ...formData, base_guests: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цена за доп. гостя (₽) *
              </label>
              <input
                type="number"
                value={formData.extra_guest_price}
                onChange={(e) => setFormData({ ...formData, extra_guest_price: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="4"
              placeholder="Описание бани..."
            ></textarea>
          </div>

          {/* Выбор акций */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Связанные акции
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-xl p-4">
              {promotions.filter(p => p.is_active).map(promo => (
                <label key={promo.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPromotionIds.includes(promo.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPromotionIds(prev => [...prev, promo.id]);
                      } else {
                        setSelectedPromotionIds(prev => prev.filter(id => id !== promo.id));
                      }
                    }}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{promo.name}</div>
                    {promo.description && (
                      <div className="text-xs text-gray-500">{promo.description}</div>
                    )}
                  </div>
                </label>
              ))}
              {promotions.filter(p => p.is_active).length === 0 && (
                <div className="text-gray-500 text-sm text-center py-4">Нет активных акций</div>
              )}
            </div>
          </div>

          {/* Загрузка фото */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Загрузить фото (до 5 шт.)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            
            {/* Превью загруженных фото */}
            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Выбранные фото:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {selectedFiles.map((item, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={item.preview}
                        alt={`Превью ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Текущие фото (только при редактировании) */}
          {isEditing && bath?.photos && bath.photos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текущие фото:
              </label>
              <div className="flex flex-wrap gap-4">
                {bath.photos.map((photo, idx) => (
                  <div key={photo.photo_id} className="relative group">
                    <img
                      src={`${SERVER_BASE_URL}${photo.image_url}`}
                      alt={`Фото ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.photo_id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600 transition"
                      title="Удалить фото"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow transition disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить изменения' : 'Добавить баню')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/baths')}
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

export default BathForm;
