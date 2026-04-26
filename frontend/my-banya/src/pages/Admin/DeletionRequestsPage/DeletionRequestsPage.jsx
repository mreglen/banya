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
  const markedIds = useSelector(state => state.deletionRequests); // это массив!
  const { data: products = [] } = useGetProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();

  // ✅ Используем .includes(), а не .has()
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
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Запросы на удаление</h1>
        <div className="bg-white rounded-2xl shadow p-12 text-center">
          <p className="text-gray-500">Нет запросов на удаление</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Запросы на удаление</h1>
      <div className="bg-white rounded-2xl shadow">
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
                      {
                        label: 'Редактировать',
                        icon: '✏️',
                        color: 'blue',
                        onClick: () => handleEdit(product.id),
                      },
                      {
                        label: 'Удалить',
                        icon: '🗑️',
                        color: 'red',
                        onClick: () => handleConfirmDelete(product.id),
                      },
                      {
                        label: 'Отменить запрос',
                        icon: '❌',
                        color: 'gray',
                        onClick: () => handleCancelRequest(product.id),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeletionRequestsPage;