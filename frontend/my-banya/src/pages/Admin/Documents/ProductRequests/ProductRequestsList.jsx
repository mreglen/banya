import { useNavigate } from 'react-router-dom';
import { useGetProductRequestsQuery } from '../../../../redux/slices/productsApiSlice';
import { useHasAccess } from '../../../../hooks/useHasAccess';

function ProductRequestsList() {
  const navigate = useNavigate();
  const hasAccess = useHasAccess();
  const canManage = hasAccess('documents:manage');
  const { data: requests = [], isLoading, isError, error, refetch } = useGetProductRequestsQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
        <p className="text-gray-500">Загрузка заявок...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 border border-red-100">
          <h1 className="text-xl font-bold text-gray-800 mb-3">Заявки на товар</h1>
          <p className="text-red-700 mb-3">Не удалось загрузить заявки.</p>
          <p className="text-sm text-gray-600 mb-4">
            {error?.data?.detail || error?.error || 'Проверьте доступность API'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Заявки на товар</h1>
          {canManage && (
            <button
              onClick={() => navigate('/admin/documents/product-requests/add')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow"
            >
              + Новая заявка
            </button>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Нет заявок на товар</p>
            {canManage && (
              <button
                onClick={() => navigate('/admin/documents/product-requests/add')}
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Создать первую заявку
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Автор</th>
                  <th className="px-4 py-3">Ожидает</th>
                  <th className="px-4 py-3">Подтверждено</th>
                  <th className="px-4 py-3">Отклонено</th>
                  <th className="px-4 py-3">Комментарий</th>
                  <th className="px-4 py-3 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{req.id}</td>
                    <td className="px-4 py-3">{req.date}</td>
                    <td className="px-4 py-3">{req.created_by?.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-amber-700 font-semibold">{req.pending_count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-green-700">{req.approved_count || 0}</td>
                    <td className="px-4 py-3 text-red-600">{req.rejected_count || 0}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.comment || '—'}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => navigate(`/admin/documents/product-requests/${req.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Открыть
                      </button>
                      {canManage && (req.pending_count || 0) > 0 && (
                        <button
                          onClick={() => navigate(`/admin/documents/product-requests/edit/${req.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Изменить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden p-3 space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-semibold">Заявка #{req.id}</div>
                  <div className="text-sm text-gray-600 mt-1">Дата: {req.date}</div>
                  <div className="text-sm text-gray-600">Автор: {req.created_by?.full_name || '—'}</div>
                  <div className="text-sm mt-2 flex gap-3">
                    <span className="text-amber-700">Ожидает: {req.pending_count || 0}</span>
                    <span className="text-green-700">OK: {req.approved_count || 0}</span>
                    <span className="text-red-600">Откл: {req.rejected_count || 0}</span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => navigate(`/admin/documents/product-requests/${req.id}`)}
                      className="text-blue-600 font-medium text-sm"
                    >
                      Открыть
                    </button>
                    {canManage && (req.pending_count || 0) > 0 && (
                      <button
                        onClick={() => navigate(`/admin/documents/product-requests/edit/${req.id}`)}
                        className="text-gray-700 text-sm"
                      >
                        Изменить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductRequestsList;
