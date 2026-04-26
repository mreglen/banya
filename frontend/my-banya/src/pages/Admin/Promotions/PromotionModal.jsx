import { useState, useEffect } from 'react';
import { useCreatePromotionMutation, useUpdatePromotionMutation } from '../../../redux/slices/promotionsApiSlice';
import ProductSelectorModal from './ProductSelectorModal';

function PromotionModal({ isOpen, onClose, promotion = null }) {
  const [createPromotion] = useCreatePromotionMutation();
  const [updatePromotion] = useUpdatePromotionMutation();
  
  const [template, setTemplate] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    min_hours: null,
    min_guests: null,
    min_amount: null,
    applicable_weekdays: [],
    valid_from: '',
    valid_until: '',
    bonus_minutes: null,
    gift_products: []
  });

  // Сброс формы при открытии
  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        // Режим редактирования
        setTemplate('combined');
        setFormData({
          name: promotion.name || '',
          description: promotion.description || '',
          is_active: promotion.is_active ?? true,
          min_hours: promotion.min_hours || null,
          min_guests: promotion.min_guests || null,
          min_amount: promotion.min_amount || null,
          applicable_weekdays: promotion.applicable_weekdays || [],
          valid_from: promotion.valid_from || '',
          valid_until: promotion.valid_until || '',
          bonus_minutes: promotion.bonus_minutes || null,
          gift_products: promotion.gift_products || []
        });
      } else {
        // Режим создания
        setTemplate('');
        setFormData({
          name: '',
          description: '',
          is_active: true,
          min_hours: null,
          min_guests: null,
          min_amount: null,
          applicable_weekdays: [],
          valid_from: '',
          valid_until: '',
          bonus_minutes: null,
          gift_products: []
        });
      }
    }
  }, [isOpen, promotion]);

  if (!isOpen) return null;

  const isEditing = !!promotion;

  // Обработка выбора шаблона
  const handleTemplateSelect = (selectedTemplate) => {
    setTemplate(selectedTemplate);
    
    // Сбросить все условия
    setFormData(prev => ({
      ...prev,
      min_hours: null,
      min_guests: null,
      min_amount: null,
      applicable_weekdays: [],
      valid_from: '',
      valid_until: ''
    }));
  };

  // Обработка изменения полей
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));
  };

  // Обработка дней недели
  const handleWeekdayToggle = (day) => {
    setFormData(prev => {
      const weekdays = prev.applicable_weekdays || [];
      if (weekdays.includes(day)) {
        return { ...prev, applicable_weekdays: weekdays.filter(d => d !== day) };
      } else {
        return { ...prev, applicable_weekdays: [...weekdays, day] };
      }
    });
  };

  // Добавление товара в подарок
  const handleAddProduct = (product) => {
    setFormData(prev => ({
      ...prev,
      gift_products: [...prev.gift_products, { product_id: product.id, product_name: product.name, quantity: 1 }]
    }));
  };

  // Удаление товара из подарков
  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      gift_products: prev.gift_products.filter((_, i) => i !== index)
    }));
  };

  // Изменение количества товара
  const handleQuantityChange = (index, quantity) => {
    setFormData(prev => ({
      ...prev,
      gift_products: prev.gift_products.map((item, i) => 
        i === index ? { ...item, quantity: parseInt(quantity) || 1 } : item
      )
    }));
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        // Преобразовать пустые строки в null
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        // Преобразовать applicable_weekdays: если пустой массив, то null
        applicable_weekdays: formData.applicable_weekdays.length > 0 ? formData.applicable_weekdays : null,
        // Убрать product_name из gift_products (нужен только product_id)
        gift_products: formData.gift_products.map(gp => ({
          product_id: gp.product_id,
          quantity: gp.quantity
        }))
      };

      if (isEditing) {
        await updatePromotion({ id: promotion.id, ...payload }).unwrap();
      } else {
        await createPromotion(payload).unwrap();
      }
      
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения акции:', error);
      alert(error.data?.detail || 'Не удалось сохранить акцию');
    }
  };

  const weekDays = [
    { id: 1, name: 'Пн' },
    { id: 2, name: 'Вт' },
    { id: 3, name: 'Ср' },
    { id: 4, name: 'Чт' },
    { id: 5, name: 'Пт' },
    { id: 6, name: 'Сб' },
    { id: 7, name: 'Вс' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Редактировать акцию' : 'Добавить акцию'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light transition-colors"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Шаг 1: Выбор шаблона (только при создании) */}
          {!isEditing && !template && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Выберите тип акции</label>
              <div className="space-y-2">
                {[
                  { id: 'hours', label: 'При заказе от X часов - подарок', desc: 'Пример: При заказе от 4 часов' },
                  { id: 'guests', label: 'При заказе от X человек - подарок', desc: 'Пример: При заказе от 6 человек' },
                  { id: 'amount', label: 'При минимальной сумме от X руб - подарок', desc: 'Пример: При заказе от 5000 руб' },
                  { id: 'weekdays', label: 'В определённые дни недели - подарок', desc: 'Пример: Только в будни' },
                  { id: 'period', label: 'В период с X по Y - подарок', desc: 'Пример: С 1 января по 31 марта' },
                  { id: 'combined', label: 'Комбинированная (несколько условий)', desc: 'Все условия доступны' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateSelect(t.id)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                  >
                    <div className="font-medium text-gray-800">{t.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Шаг 2 и 3: Условия и подарки */}
          {(isEditing || template) && (
            <>
              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название акции *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Условия */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Условия акции</h3>
                
                <div className="space-y-4">
                  {/* Минимум часов */}
                  {(template === 'hours' || template === 'combined') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Минимальное количество часов
                      </label>
                      <input
                        type="number"
                        name="min_hours"
                        value={formData.min_hours || ''}
                        onChange={handleChange}
                        min="1"
                        placeholder="Например: 4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Минимум гостей */}
                  {(template === 'guests' || template === 'combined') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Минимальное количество гостей
                      </label>
                      <input
                        type="number"
                        name="min_guests"
                        value={formData.min_guests || ''}
                        onChange={handleChange}
                        min="1"
                        placeholder="Например: 6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Минимальная сумма */}
                  {(template === 'amount' || template === 'combined') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Минимальная сумма (руб)
                      </label>
                      <input
                        type="number"
                        name="min_amount"
                        value={formData.min_amount || ''}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="Например: 5000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Дни недели */}
                  {(template === 'weekdays' || template === 'combined') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дни недели
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => handleWeekdayToggle(day.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              formData.applicable_weekdays.includes(day.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {day.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Период действия */}
                  {(template === 'period' || template === 'combined') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Дата начала
                        </label>
                        <input
                          type="date"
                          name="valid_from"
                          value={formData.valid_from}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Дата окончания
                        </label>
                        <input
                          type="date"
                          name="valid_until"
                          value={formData.valid_until}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Подарки */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Подарки</h3>
                
                <div className="space-y-4">
                  {/* Доп. время */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дополнительное время (минуты)
                    </label>
                    <input
                      type="number"
                      name="bonus_minutes"
                      value={formData.bonus_minutes || ''}
                      onChange={handleChange}
                      min="0"
                      placeholder="Например: 60"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Товары в подарок */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Товары в подарок
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-gray-600 hover:text-blue-600"
                    >
                      + Добавить товар
                    </button>

                    {/* Список добавленных товаров */}
                    {formData.gift_products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.gift_products.map((gp, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{gp.product_name}</div>
                            </div>
                            <input
                              type="number"
                              value={gp.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              min="1"
                              className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Активность */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Акция активна
                </label>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        {(isEditing || template) && (
          <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {isEditing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        )}
      </div>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelect={handleAddProduct}
      />
    </div>
  );
}

export default PromotionModal;
