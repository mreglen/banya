import { useState } from 'react';
import { useGetPromotionsQuery, useDeletePromotionMutation } from '../../../redux/slices/promotionsApiSlice';
import PromotionModal from './PromotionModal';
import ActionDropdown from '../../../components/UI/ActionDropdown/ActionDropdown';
import PromotionsSkeleton from './PromotionsSkeleton';

function Promotions() {
  const { data: promotions = [], isLoading } = useGetPromotionsQuery();
  const [deletePromotion] = useDeletePromotionMutation();
  
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const handleAdd = () => {
    setEditingPromotion(null);
    setShowModal(true);
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить эту акцию?')) {
      try {
        await deletePromotion(id).unwrap();
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
  };

  // Форматирование условий акции
  const formatConditions = (promotion) => {
    const conditions = [];
    
    if (promotion.min_hours) conditions.push(`от ${promotion.min_hours} ч`);
    if (promotion.min_guests) conditions.push(`от ${promotion.min_guests} чел`);
    if (promotion.min_amount) conditions.push(`от ${promotion.min_amount} ₽`);
    if (promotion.valid_from || promotion.valid_until) {
      const from = promotion.valid_from ? new Date(promotion.valid_from).toLocaleDateString('ru-RU') : '';
      const until = promotion.valid_until ? new Date(promotion.valid_until).toLocaleDateString('ru-RU') : '';
      if (from && until) conditions.push(`${from} - ${until}`);
      else if (from) conditions.push(`с ${from}`);
      else if (until) conditions.push(`до ${until}`);
    }
    
    return conditions.join(', ') || 'Без условий';
  };

  // Форматирование подарков
  const formatGifts = (promotion) => {
    const gifts = [];
    
    if (promotion.bonus_minutes) {
      gifts.push(`+${promotion.bonus_minutes} мин`);
    }
    
    promotion.gift_products?.forEach(gp => {
      gifts.push(`${gp.product_name} x${gp.quantity}`);
    });
    
    return gifts.join(', ') || 'Нет подарков';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Акции</h1>
            <p className="text-gray-600 mt-1">Управление акциями и специальными предложениями</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить акцию
          </button>
        </div>

        {/* Promotions List */}
        {isLoading ? (
          <PromotionsSkeleton />
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">Пока нет акций</h2>
            <p className="text-gray-600 mb-6">
              Создайте первую акцию для привлечения клиентов
            </p>
            <button
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition"
            >
              Создать акцию
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-800">{promotion.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          promotion.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {promotion.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                    </div>
                    
                    {promotion.description && (
                      <p className="text-gray-600 mb-4">{promotion.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Условия: </span>
                        <span className="text-gray-600">{formatConditions(promotion)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Подарки: </span>
                        <span className="text-gray-600">{formatGifts(promotion)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <ActionDropdown
                      actions={[
                        {
                          label: 'Редактировать',
                          icon: '✏️',
                          color: 'blue',
                          onClick: () => handleEdit(promotion),
                        },
                        {
                          label: 'Удалить',
                          icon: '🗑️',
                          color: 'red',
                          onClick: () => handleDelete(promotion.id),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <PromotionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        promotion={editingPromotion}
      />
    </div>
  );
}

export default Promotions;
