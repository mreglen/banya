// src/pages/Admin/AdminBaths/AdminBathsList.jsx
import { useNavigate } from 'react-router-dom';
import { useGetBathsQuery } from '../../../redux/slices/apiSlice';
import AdminBathsSkeleton from './AdminBathsSkeleton';

function AdminBathsList() {
  const navigate = useNavigate();
  const { data: baths, isLoading, error } = useGetBathsQuery();
  
  // Для фото используем базовый URL сервера (без /api)
  const SERVER_BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');

  if (isLoading) return <AdminBathsSkeleton />;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error.toString()}</div>;

  const handleAddClick = () => {
    navigate('/admin/baths/add');
  };

  const handleEditClick = (bathId) => {
    navigate(`/admin/baths/edit/${bathId}`);
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
              src={bath.photos?.[0] ? `${SERVER_BASE_URL}${bath.photos[0].image_url}` : '/img/placeholder.jpg'}
              alt={bath.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h3 className="font-bold text-gray-800 text-lg">{bath.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{bath.title}</p>
              <p className="font-semibold text-green-600 mt-2">от {bath.cost_weekday} ₽/час</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBathsList;