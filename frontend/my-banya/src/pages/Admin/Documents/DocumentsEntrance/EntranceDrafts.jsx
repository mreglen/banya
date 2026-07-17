import { useNavigate } from 'react-router-dom';
import {
  useGetEntranceDocumentsQuery,
  useDeleteEntranceDocumentMutation,
} from '../../../../redux/slices/productsApiSlice';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';

function EntranceDrafts() {
  const navigate = useNavigate();
  const {
    data: documents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEntranceDocumentsQuery('draft');
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteEntranceDocumentMutation();

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить черновик?')) return;
    try {
      await deleteDocument(id).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Загрузка черновиков...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-xl font-bold mb-3">Черновики поступления</h1>
          <p className="text-red-600 mb-3">Не удалось загрузить черновики</p>
          <p className="text-sm text-gray-600 mb-4">{error?.data?.detail || error?.error}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-green-600 text-white rounded-lg">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Черновики поступления</h1>
          <button
            onClick={() => navigate('/admin/documents/entrance')}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
          >
            ← К проведённым документам
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">Нет черновиков</p>
            <p className="text-sm text-gray-400 mt-2">
              Черновики появляются после подтверждения позиций в заявках на товар
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Из заявки</th>
                  <th className="px-4 py-3">Позиций</th>
                  <th className="px-4 py-3">Сумма</th>
                  <th className="px-4 py-3">Комментарий</th>
                  <th className="px-4 py-3 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{doc.id}</td>
                    <td className="px-4 py-3">{doc.date}</td>
                    <td className="px-4 py-3">
                      {doc.created_from_request_id ? `#${doc.created_from_request_id}` : '—'}
                    </td>
                    <td className="px-4 py-3">{doc.items?.length || 0}</td>
                    <td className="px-4 py-3">{Number(doc.total_amount || 0).toFixed(2)} ₽</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{doc.comment || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <ActionDropdown
                        buttonText="⋮"
                        actions={[
                          {
                            label: 'Открыть',
                            color: 'blue',
                            onClick: () => navigate(`/admin/documents/entrance/edit/${doc.id}`),
                          },
                          {
                            label: 'Удалить',
                            color: 'red',
                            onClick: () => handleDelete(doc.id),
                            disabled: isDeleting,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden p-3 space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-semibold">Черновик #{doc.id}</div>
                  <div className="text-sm text-gray-600 mt-1">Дата: {doc.date}</div>
                  <div className="text-sm text-gray-600">
                    Из заявки: {doc.created_from_request_id ? `#${doc.created_from_request_id}` : '—'}
                  </div>
                  <div className="text-sm mt-1">
                    {doc.items?.length || 0} поз. · {Number(doc.total_amount || 0).toFixed(2)} ₽
                  </div>
                  <button
                    onClick={() => navigate(`/admin/documents/entrance/edit/${doc.id}`)}
                    className="mt-3 text-blue-600 text-sm font-medium"
                  >
                    Открыть и провести
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EntranceDrafts;
