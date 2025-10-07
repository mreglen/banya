// src/pages/Admin/AdminBaths/AdminBathsList.jsx
import { useState } from 'react';
import { useGetBathsQuery } from '../../../redux/slices/apiSlice';
import AdminBathModal from './AdminBathModal';

function AdminBathsList() {
  const { data: baths, isLoading, error } = useGetBathsQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBathId, setEditingBathId] = useState(null);

  if (isLoading) return <div className="p-8">Загрузка бань...</div>;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error.toString()}</div>;

  const handleAddClick = () => {
    setEditingBathId(null);
    setModalOpen(true);
  };

  const handleEditClick = (bathId) => {
    setEditingBathId(bathId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBathId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Бани</h1>
        <button
          onClick={handleAddClick}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-md transition flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Добавить баню</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {baths?.map((bath) => (
          <div
            key={bath.bath_id}
            className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1 border border-gray-100"
            onClick={() => handleEditClick(bath.bath_id)}
          >
            <img
              src={bath.image || '/img/placeholder.jpg'}
              alt={bath.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h3 className="font-bold text-gray-800 text-lg">{bath.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{bath.subtitle}</p>
              <p className="font-semibold text-green-600 mt-2">{bath.cost} ₽</p>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                {bath.photos?.length || 0} фото
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно редактирования */}
      {modalOpen && (
        <AdminBathModal
          bathId={editingBathId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default AdminBathsList;