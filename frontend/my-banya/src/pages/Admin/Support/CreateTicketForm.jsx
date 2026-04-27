import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicketMutation } from '../../../redux/supportApiSlice';

function CreateTicketForm() {
  const navigate = useNavigate();
  const [createTicket, { isLoading, error }] = useCreateTicketMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Очистка ошибки при вводе
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Проверка количества файлов
    if (selectedFiles.length > 5) {
      setValidationErrors((prev) => ({
        ...prev,
        files: 'Максимум 5 фотографий',
      }));
      return;
    }

    // Проверка типов и размера файлов
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    const invalidFiles = selectedFiles.filter(
      (file) => !allowedTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      setValidationErrors((prev) => ({
        ...prev,
        files: 'Недопустимый формат или размер файла (макс. 5 МБ)',
      }));
      return;
    }

    setFiles(selectedFiles);

    // Создание превью
    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
    setValidationErrors((prev) => ({ ...prev, files: '' }));
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const validateForm = () => {
    const errors = {};

    if (formData.title.trim().length < 5) {
      errors.title = 'Заголовок должен содержать минимум 5 символов';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Заголовок не должен превышать 200 символов';
    }

    if (formData.description.trim().length < 10) {
      errors.description = 'Описание должно содержать минимум 10 символов';
    } else if (formData.description.trim().length > 5000) {
      errors.description = 'Описание не должно превышать 5000 символов';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());

      files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const result = await createTicket(formDataToSend).unwrap();
      navigate(`/admin/support/ticket/${result.id}`);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setValidationErrors({
        submit: err.data?.detail || 'Ошибка при создании обращения',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/support')}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад к списку
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Создать обращение</h1>
        <p className="text-gray-600 mt-2">Опишите вашу проблему, и мы ответим вам в ближайшее время</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {validationErrors.submit || 'Ошибка при создании обращения'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Заголовок */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                validationErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Кратко опишите проблему"
              disabled={isLoading}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Подробно опишите вашу проблему..."
              disabled={isLoading}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length} / 5000 символов
            </p>
          </div>

          {/* Прикрепление файлов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Прикрепить фото (до 5 штук)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
              <input
                type="file"
                id="files"
                name="files"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              <label
                htmlFor="files"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                Выбрать фото
              </label>
              {validationErrors.files && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.files}</p>
              )}
            </div>

            {/* Превью файлов */}
            {filePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Превью ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? 'Отправка...' : 'Отправить обращение'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/support')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicketForm;
