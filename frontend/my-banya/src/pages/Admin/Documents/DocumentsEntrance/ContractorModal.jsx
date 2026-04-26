// src/components/ContractorModal.jsx
import { useNavigate } from 'react-router-dom';
import { useGetPartnersQuery } from '../../../../redux/slices/apiSlice'; 

const ContractorModal = ({ isOpen, onClose, onSelect, currentUrl }) => {
  const navigate = useNavigate();

  // RTK Query для получения поставщиков
  const { data: partnersData = [], isLoading: isLoadingPartners } = useGetPartnersQuery();

  if (!isOpen) return null;

  const handleAddNew = () => {
    navigate('/admin/company/partner/add', {
      state: {
        fromDocument: { returnTo: currentUrl }
      }
    });
    onClose(); // Закрываем модальное окно при переходе
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Выберите поставщика</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingPartners ? (
            <div className="text-center py-4 text-gray-600">Загрузка поставщиков...</div>
          ) : (
            <ul className="space-y-2">
              {partnersData.map((partner) => (
                <li
                  key={partner.partner_id}
                  onClick={() => {
                    onSelect(partner);
                    onClose();
                  }}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <div className="font-medium">{partner.supplier_name}</div>
                  <div className="text-sm text-gray-600">{partner.person_name}</div>
                </li>
              ))}
            </ul>
          )}
          {partnersData.length === 0 && !isLoadingPartners && (
            <div className="text-center py-4 text-gray-600">Нет доступных поставщиков</div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow transition"
          >
            Добавить нового поставщика
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium shadow transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorModal;