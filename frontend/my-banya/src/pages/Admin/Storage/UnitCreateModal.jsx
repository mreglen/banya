import { useState } from 'react';
import { useCreateUnitMutation } from '../../../redux/slices/productsApiSlice';

function UnitCreateModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createUnit, { isLoading }] = useCreateUnitMutation();

  if (!isOpen) return null;

  const resetAndClose = () => {
    setName('');
    setDescription('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Введите название единицы измерения');
      return;
    }

    try {
      const created = await createUnit({
        name: name.trim(),
        description: description.trim() || null,
      }).unwrap();
      setName('');
      setDescription('');
      onCreated?.(created);
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.detail || 'Не удалось создать единицу измерения');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Новая единица измерения</h3>

          {errorMessage && (
            <div className="p-2 rounded bg-red-50 text-red-700 text-sm border border-red-200">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="например: кг"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="например: килограмм"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnitCreateModal;
