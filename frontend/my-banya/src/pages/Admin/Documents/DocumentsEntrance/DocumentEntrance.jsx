import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetEntranceDocumentsQuery,
  useDeleteEntranceDocumentMutation,
} from '../../../../redux/slices/productsApiSlice';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';
import DocumentsEntranceSkeleton from './DocumentsEntranceSkeleton';

function DocumentEntrance() {
  const navigate = useNavigate();

  const {
    data: documents = [],
    isLoading,
    refetch,
  } = useGetEntranceDocumentsQuery();

  const [deleteDocument, { isLoading: isDeleting }] = useDeleteEntranceDocumentMutation();

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить документ?')) return;
    try {
      await deleteDocument(id).unwrap();
      refetch();
    } catch (error) {
      console.error('Ошибка удаления документа:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/documents/entrance/edit/${id}`);
  };

  if (isLoading) {
    return <DocumentsEntranceSkeleton />;
  }

  const sortedDocs = [...documents].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Поступление товаров</h1>
          <button
            onClick={() => navigate('/admin/documents/entrance/add')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium shadow transition flex items-center justify-center space-x-1 sm:space-x-2"
          >
            <span>➕</span>
            <span className="text-sm sm:text-base">Новый документ</span>
          </button>
        </div>

        {sortedDocs.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow p-6 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg">Нет документов поступления</p>
            <button
              onClick={() => navigate('/admin/documents/entrance/add')}
              className="mt-4 text-green-600 hover:text-green-800 font-medium text-sm"
            >
              Создать первый документ
            </button>
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-lg mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">ID</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Дата</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Поставщик</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Сумма</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Ответственный</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-700 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => handleEdit(doc.id)}
                    >
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">{doc.id}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(doc.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {doc.supplier?.supplier_name || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {typeof doc.total_amount === 'number' ? doc.total_amount.toFixed(2) : '—'} ₽
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {doc.responsible_name || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <ActionDropdown
                          actions={[
                            {
                              label: 'Редактировать',
                              icon: '✏️',
                              color: 'green',
                              onClick: () => handleEdit(doc.id),
                            },
                            {
                              label: isDeleting ? 'Удаление...' : 'Удалить',
                              icon: '🗑️',
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
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-4">
              {sortedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-md cursor-pointer"
                  onDoubleClick={() => handleEdit(doc.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Документ #{doc.id}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(doc.date).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-800">
                        {typeof doc.total_amount === 'number' ? doc.total_amount.toFixed(2) : '—'} ₽
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-700">
                    <div><span className="font-medium">Поставщик:</span> {doc.supplier?.supplier_name || '—'}</div>
                    <div><span className="font-medium">Ответственный:</span> {doc.responsible_name || '—'}</div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(doc.id);
                      }}
                      className="flex-1 text-sm bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 min-h-[44px]"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      disabled={isDeleting}
                      className={`flex-1 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-lg min-h-[44px] ${
                        isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-200'
                      }`}
                    >
                      {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentEntrance;