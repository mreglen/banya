import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetProductRequestByIdQuery,
  useApproveProductRequestItemsMutation,
  useRejectProductRequestItemsMutation,
} from '../../../../redux/slices/productsApiSlice';
import { useHasAccess } from '../../../../hooks/useHasAccess';
import { toast } from 'react-hot-toast';

const STATUS_LABELS = {
  pending: 'Ожидает',
  approved: 'Подтверждена',
  rejected: 'Отклонена',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function ProductRequestReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const hasAccess = useHasAccess();
  const canManage = hasAccess('documents:manage');
  const canApprove = Boolean(user?.is_admin || user?.is_director);

  const { data: request, isLoading, isError, refetch } = useGetProductRequestByIdQuery(id);
  const [approveItems, { isLoading: isApproving }] = useApproveProductRequestItemsMutation();
  const [rejectItems, { isLoading: isRejecting }] = useRejectProductRequestItemsMutation();

  const [selectedIds, setSelectedIds] = useState([]);

  const pendingItems = useMemo(
    () => (request?.items || []).filter((item) => item.status === 'pending'),
    [request]
  );

  const toggleItem = (itemId) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId]
    );
  };

  const selectAllPending = () => {
    setSelectedIds(pendingItems.map((item) => item.id));
  };

  const clearSelection = () => setSelectedIds([]);

  const handleApprove = async () => {
    if (!selectedIds.length) {
      toast.error('Выберите позиции для подтверждения');
      return;
    }
    try {
      await approveItems({ id: Number(id), item_ids: selectedIds }).unwrap();
      toast.success('Позиции подтверждены. Создан черновик поступления.');
      setSelectedIds([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.detail || 'Не удалось подтвердить');
    }
  };

  const handleReject = async () => {
    if (!selectedIds.length) {
      toast.error('Выберите позиции для отклонения');
      return;
    }
    if (!window.confirm('Отклонить выбранные позиции?')) return;
    try {
      await rejectItems({ id: Number(id), item_ids: selectedIds }).unwrap();
      toast.success('Позиции отклонены');
      setSelectedIds([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.detail || 'Не удалось отклонить');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Загрузка...
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
          <p className="text-red-600 mb-4">Заявка не найдена</p>
          <button
            onClick={() => navigate('/admin/documents/product-requests')}
            className="text-blue-600"
          >
            К списку заявок
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Заявка #{request.id}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Дата: {request.date} · Автор: {request.created_by?.full_name || '—'}
            </p>
            {request.comment && (
              <p className="text-sm text-gray-700 mt-2">Комментарий: {request.comment}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && (request.pending_count || 0) > 0 && (
              <button
                onClick={() => navigate(`/admin/documents/product-requests/edit/${request.id}`)}
                className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
              >
                Дополнить
              </button>
            )}
            <button
              onClick={() => navigate('/admin/documents/product-requests')}
              className="px-3 py-2 rounded-lg border text-sm"
            >
              Назад
            </button>
          </div>
        </div>

        {canApprove && pendingItems.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={selectAllPending}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Выбрать всё
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700"
            >
              Снять выбор
            </button>
            <span className="text-sm text-gray-500 mx-2">Выбрано: {selectedIds.length}</span>
            <button
              type="button"
              disabled={isApproving || !selectedIds.length}
              onClick={handleApprove}
              className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Подтвердить
            </button>
            <button
              type="button"
              disabled={isRejecting || !selectedIds.length}
              onClick={handleReject}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Отклонить
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/documents/entrance/drafts')}
              className="ml-auto text-sm text-blue-600 hover:underline"
            >
              Черновики поступления →
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
              <tr>
                {canApprove && <th className="px-4 py-3 w-10" />}
                <th className="px-4 py-3">Товар</th>
                <th className="px-4 py-3">Кол-во</th>
                <th className="px-4 py-3">Цена закупки</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Черновик</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(request.items || []).map((item) => {
                const isPending = item.status === 'pending';
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {canApprove && (
                      <td className="px-4 py-3">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleItem(item.id)}
                          />
                        ) : null}
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium">{item.product?.name || `ID ${item.product_id}`}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{Number(item.purchase_price || 0).toFixed(2)} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.entrance_document_id ? (
                        <button
                          type="button"
                          className="text-blue-600 hover:underline"
                          onClick={() =>
                            navigate(`/admin/documents/entrance/edit/${item.entrance_document_id}`)
                          }
                        >
                          #{item.entrance_document_id}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductRequestReview;
