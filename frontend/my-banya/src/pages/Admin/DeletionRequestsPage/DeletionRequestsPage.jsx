// src/pages/Admin/Storage/DeletionRequestsPage.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from '../../../redux/slices/productsApiSlice';
import { unmarkForDeletion, confirmDeletion } from '../../../redux/slices/deletionRequestsSlice';
import ActionDropdown from '../../../components/UI/ActionDropdown/ActionDropdown';

const DeletionRequestsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const markedIds = useSelector(state => state.deletionRequests);
  const { data: products = [] } = useGetProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();

  const requests = products.filter(p => markedIds.includes(p.id));

  const handleConfirmDelete = async (productId) => {
    if (!window.confirm('Удалить товар навсегда?')) return;
    try {
      await deleteProduct(productId).unwrap();
      dispatch(confirmDeletion(productId));
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const handleCancelRequest = (productId) => {
    dispatch(unmarkForDeletion(productId));
  };

  const handleEdit = (productId) => {
    navigate(`/admin/storage/product/${productId}`);
  };

  if (requests.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Запросы на удаление</h1>
        <div className="bg-white rounded-2xl shadow p-10 md:p-12 text-center">
          <p className="text-gray-500 text-sm">Нет запросов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Запросы на удаление</h1>

      <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
        <table className="table-auto w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Наименование</th>
              <th className="px-6 py-3 text-left">Описание</th>
              <th className="px-6 py-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{product.name}</td>
                <td className="px-6 py-4">{product.description || '—'}</td>
                <td className="px-6 py-4">
                  <ActionDropdown
                    actions={[
                      { label: 'Редактировать', color: 'blue', onClick: () => handleEdit(product.id) },
                      { label: 'Удалить', color: 'red', onClick: () => handleConfirmDelete(product.id) },
                      { label: 'Отменить запрос', color: 'gray', onClick: () => handleCancelRequest(product.id) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {requests.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description || '—'}</p>
            <div className="grid grid-cols-1 gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleEdit(product.id)}
                className="min-h-[44px] rounded-xl bg-blue-50 text-blue-700 text-sm font-medium"
              >
                Редактировать
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(product.id)}
                className="min-h-[44px] rounded-xl bg-red-50 text-red-700 text-sm font-medium"
              >
                Удалить
              </button>
              <button
                type="button"
                onClick={() => handleCancelRequest(product.id)}
                className="min-h-[44px] rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
              >
                Отменить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeletionRequestsPage;
