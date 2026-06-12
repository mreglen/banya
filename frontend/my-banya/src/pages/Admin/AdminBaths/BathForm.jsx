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
import { prepareImageForUpload } from '../../../utils/imageProcessing';
import { toast } from 'react-hot-toast';

const MAX_FILES = 5;

const formatApiError = (detail, fallback = 'Ошибка при сохранении бани') => {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => e.msg || JSON.stringify(e)).join('; ');
  }
  return String(detail);
};

function BathForm() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const isEditing = !!slug;

  // Для фото используем базовый URL сервера (без /api)
  const SERVER_BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');

  const { data: bath, isLoading: isLoadingBath, isError: isBathError, refetch: refetchBath } = useGetBathByIdQuery(slug, { skip: !isEditing });
  const bathId = bath?.bath_id ?? null;
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
    min_booking_hours: 1,
    description: '',
    base_guests: 4,
    extra_guest_price: 500,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // Track upload progress

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (bath) {
      setFormData({
        name: bath.name,
        title: bath.title,
        cost_weekday: bath.cost_weekday,
        cost_weekend: bath.cost_weekend,
        min_booking_hours: bath.min_booking_hours || 1,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Введите название бани');
      return;
    }
    if (!formData.title) {
      toast.error('Введите заголовок');
      return;
    }
    if (!formData.cost_weekday || Number(formData.cost_weekday) <= 0) {
      toast.error('Введите корректную цену за будни');
      return;
    }
    if (!formData.cost_weekend || Number(formData.cost_weekend) <= 0) {
      toast.error('Введите корректную цену за выходные');
      return;
    }
    if (!formData.min_booking_hours || Number(formData.min_booking_hours) < 1) {
      toast.error('Минимальное количество часов должно быть не меньше 1');
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);
    
    try {
      let resultBathId = bathId;

      if (isEditing) {
        if (!bathId) {
          toast.error('Не удалось определить баню для сохранения');
          return;
        }
        // Обновляем существующую баню
        await updateBath({
          bath_id: bathId,
          name: formData.name,
          title: formData.title,
          cost_weekday: Number(formData.cost_weekday),
          cost_weekend: Number(formData.cost_weekend),
          min_booking_hours: Number(formData.min_booking_hours),
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
          min_booking_hours: Number(formData.min_booking_hours),
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
        setUploadProgress(10);
        const filesToUpload = selectedFiles.map(item => item.file);
        
        try {
          await uploadPhotos({ bath_id: resultBathId, files: filesToUpload }).unwrap();
          setUploadProgress(100);
          toast.success('Фотографии успешно загружены');
        } catch (uploadErr) {
          console.error('Ошибка загрузки фото:', uploadErr);
          setUploadProgress(null);
          
          if (uploadErr.status === 413) {
            toast.error('Файлы слишком большие (макс. 10 МБ)');
          } else {
            toast.error('Ошибка при загрузке фото');
          }
          return;
        }
      }

      toast.success(isEditing ? 'Баня обновлена' : 'Баня создана');
      navigate('/admin/baths');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      toast.error(formatApiError(err.data?.detail));
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast.error(`Можно загрузить не более ${MAX_FILES} фото`);
      return;
    }

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const preparedFile = await prepareImageForUpload(file);

          return {
            file: preparedFile,
            preview: URL.createObjectURL(preparedFile),
          };
        })
      );

      setSelectedFiles(prev => [...prev, ...processedFiles]);
    } catch (err) {
      console.error('Ошибка обработки изображений:', err);
      toast.error(err.message || 'Не удалось подготовить изображения');
    } finally {
      e.target.value = '';
    }
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
      toast.success('Фото удалено');
      await refetchBath();
    } catch (err) {
      console.error('Ошибка удаления фото:', err);
      toast.error('Не удалось удалить фото');
    }
  };

  if (isLoadingBath) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Загрузка...</div>
      </div>
    );
  }

  if (isEditing && (isBathError || !bath)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Баня не найдена</p>
          <button
            type="button"
            onClick={() => navigate('/admin/baths')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Назад к списку
          </button>
        </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимум часов для брони *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.min_booking_hours}
                onChange={(e) => setFormData({ ...formData, min_booking_hours: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1"
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
              disabled={isSaving}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            
            {/* Превью загруженных фото */}
            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Выбранные фото:</p>
                  {!isSaving && (
                    <button
                      type="button"
                      onClick={() => {
                        selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
                        setSelectedFiles([]);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium transition"
                    >
                      Удалить все
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {selectedFiles.map((item, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={item.preview}
                        alt={`Превью ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      {!isSaving && (
                        <button
                          type="button"
                          onClick={() => removePreview(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                          title="Убрать из загрузки"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload progress bar */}
            {uploadProgress !== null && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Загрузка фото...</span>
                  <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
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
                  <div key={photo.photo_id} className="relative">
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
              {isSaving ? (
                uploadProgress !== null
                  ? `Загрузка фото... ${uploadProgress}%`
                  : 'Сохранение...'
              ) : (
                isEditing ? 'Сохранить изменения' : 'Добавить баню'
              )}
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
