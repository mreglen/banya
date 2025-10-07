import { useState, useEffect } from 'react';
import {
  useGetBathByIdQuery,
  useUpdateBathMutation,
  useUploadBathPhotosMutation,
} from '../../../redux/slices/apiSlice';

function AdminBathModal({ bathId, onClose }) {
  const { data: bath, isLoading } = useGetBathByIdQuery(bathId, { skip: !bathId });
  const [updateBath] = useUpdateBathMutation();
  const [uploadPhotos] = useUploadBathPhotosMutation();

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    cost: '',
    description: '',
    features: [],
    photo_urls: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Заполняем форму данными при загрузке бани
  useEffect(() => {
    if (bath) {
      setFormData({
        name: bath.name,
        title: bath.title,
        cost: bath.cost,
        description: bath.description || '',
        features: bath.features.map(f => ({ key: f.key, value: f.value })),
        photo_urls: bath.images || [],
      });
    }
  }, [bath]);

  if (isLoading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="text-white">Загрузка...</div></div>;

  const handleSave = async () => {
    if (!formData.name || !formData.title || !formData.cost) return;

    setIsSaving(true);
    try {
      await updateBath({
        bath_id: bathId,
        name: formData.name,
        title: formData.title,
        cost: Number(formData.cost),
        description: formData.description || null,
        features: formData.features.filter(f => f.key && f.value),
        photo_urls: formData.photo_urls,
      }).unwrap();

      if (selectedFiles.length > 0) {
        await uploadPhotos({ bath_id: bathId, files: selectedFiles }).unwrap();
      }

      onClose();
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { key: '', value: '' }],
    });
  };

  const updateFeature = (index, field, value) => {
    const updated = [...formData.features];
    updated[index][field] = value;
    setFormData({ ...formData, features: updated });
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {bathId ? `Редактировать баню: ${bath?.name}` : 'Новая баня'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            type="text"
            placeholder="Название бани"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="text"
            placeholder="Заголовок (например: 'Кедровая парилка')"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="number"
            placeholder="Цена (₽)"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <textarea
          placeholder="Описание бани"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 mb-6"
          rows="4"
        ></textarea>

        {/* Особенности */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Особенности</label>
          {formData.features.map((f, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ключ (например: температура)"
                value={f.key}
                onChange={(e) => updateFeature(idx, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Значение (например: 70°C)"
                value={f.value}
                onChange={(e) => updateFeature(idx, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="mt-2 text-green-600 hover:text-green-800 text-sm"
          >
            + Добавить особенность
          </button>
        </div>

        {/* Загрузка фото */}
        <div className="mb-6">
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
          {selectedFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="bg-gray-100 px-3 py-1 rounded text-sm">
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Текущие фото */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Текущие фото:</h4>
          <div className="flex flex-wrap gap-4">
            {bath?.images?.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Фото ${idx + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-xl font-medium hover:bg-gray-400 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminBathModal;