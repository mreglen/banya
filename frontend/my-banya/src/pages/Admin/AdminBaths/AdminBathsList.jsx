// src/pages/Admin/AdminBaths/AdminBathsList.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetBathsQuery, useDeleteBathMutation } from '../../../redux/slices/apiSlice';
import AdminBathsSkeleton from './AdminBathsSkeleton';
import { toast } from 'react-hot-toast';
import { isVideoUrl } from '../../../utils/mediaHelpers';

function AdminBathsList() {
  const navigate = useNavigate();
  const { data: baths, isLoading, error } = useGetBathsQuery();
  const [deleteBath, { isLoading: isDeleting }] = useDeleteBathMutation();
  const [deletingId, setDeletingId] = useState(null);

  const SERVER_BASE_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : (window.location.origin || 'http://127.0.0.1:8000');

  if (isLoading) return <AdminBathsSkeleton />;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error.toString()}</div>;

  const handleAddClick = () => {
    navigate('/admin/baths/add');
  };

  const handleEditClick = (slug) => {
    navigate(`/admin/baths/edit/${slug}`);
  };

  const handleDeleteClick = async (e, bath) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Удалить баню «${bath.name}»? Это действие нельзя отменить.`
      )
    ) {
      return;
    }

    setDeletingId(bath.bath_id);
    try {
      await deleteBath(bath.bath_id).unwrap();
      toast.success('Баня удалена');
    } catch (err) {
      const message =
        err?.data?.detail ||
        'Не удалось удалить баню. Возможно, есть связанные бронирования.';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
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
        {baths?.map((bath) => {
          const coverUrl = bath.photos?.[0]
            ? `${SERVER_BASE_URL}${bath.photos[0].image_url}`
            : '/img/placeholder.svg';
          const coverIsVideo = bath.photos?.[0] && isVideoUrl(bath.photos[0].image_url);

          return (
          <div
            key={bath.bath_id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1 border border-gray-100"
          >
            <div
              className="cursor-pointer"
              onClick={() => handleEditClick(bath.slug)}
            >
              {coverIsVideo ? (
                <video
                  src={coverUrl}
                  className="w-full h-48 object-cover bg-black"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={coverUrl}
                  alt={bath.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <h3 className="font-bold text-gray-800 text-lg">{bath.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{bath.title}</p>
                <p className="font-semibold text-green-600 mt-2">
                  от {bath.cost_weekday} ₽/час
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={() => handleEditClick(bath.slug)}
                className="flex-1 text-sm bg-green-100 text-green-800 px-3 py-2 rounded-xl font-medium hover:bg-green-200 transition min-h-[44px]"
              >
                Редактировать
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, bath)}
                disabled={isDeleting && deletingId === bath.bath_id}
                className={`flex-1 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-xl font-medium transition min-h-[44px] ${
                  isDeleting && deletingId === bath.bath_id
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-red-200'
                }`}
              >
                {isDeleting && deletingId === bath.bath_id ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminBathsList;
