import { useMemo, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetEntranceDocumentsQuery,
  useStornoEntranceDocumentMutation,
} from '../../../../redux/slices/productsApiSlice';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';
import DocumentsEntranceSkeleton from './DocumentsEntranceSkeleton';
import { useHasAccess } from '../../../../hooks/useHasAccess';
import { toast } from 'react-hot-toast';

function DocumentEntrance() {
  const navigate = useNavigate();
  const hasAccess = useHasAccess();
  const canManage = hasAccess('documents:manage');

  const {
    data: documents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEntranceDocumentsQuery();

  const [stornoDocument, { isLoading: isStorno }] = useStornoEntranceDocumentMutation();
  const [expandedId, setExpandedId] = useState(null);

  const handleStorno = async (id) => {
    if (!window.confirm('Сторнировать поступление? Остатки будут уменьшены.')) return;
    try {
      await stornoDocument(id).unwrap();
      toast.success('Поступление сторнировано');
      refetch();
    } catch (err) {
      toast.error(err?.data?.detail || 'Не удалось сторнировать');
    }
  };

  const sortedDocs = useMemo(
    () => [...documents].sort((a, b) => b.id - a.id),
    [documents]
  );

  if (isLoading) {
    return <DocumentsEntranceSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow p-6 border border-red-100">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Поступления</h1>
            <p className="text-red-700 mb-3">Не удалось загрузить журнал поступлений.</p>
            <p className="text-sm text-gray-600 mb-4">
              {error?.data?.detail || error?.error || 'Проверьте доступность API.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = (doc) => {
    if (doc.reverses_id) {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Сторно #{doc.reverses_id}</span>;
    }
    if (doc.reversed_by_id) {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Отменён</span>;
    }
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Проведено</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Поступления</h1>
          {canManage && (
            <button
              onClick={() => navigate('/admin/documents/entrance/receive')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium shadow transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm sm:text-base">Оприходовать</span>
            </button>
          )}
        </div>

        {sortedDocs.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow p-6 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg">Пока нет поступлений</p>
            {canManage && (
              <button
                onClick={() => navigate('/admin/documents/entrance/receive')}
                className="mt-4 text-green-600 hover:text-green-800 font-medium text-sm"
              >
                Оприходовать товары
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Дата</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Позиции</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Сумма</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ответственный</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedDocs.map((doc) => {
                    const open = expandedId === doc.id;
                    return (
                      <Fragment key={doc.id}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedId(open ? null : doc.id)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">#{doc.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(doc.date).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-4 py-3">{statusBadge(doc)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{doc.items?.length || 0}</td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${Number(doc.total_amount) < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                            {typeof doc.total_amount === 'number' ? doc.total_amount.toFixed(2) : '—'} ₽
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{doc.responsible_name || '—'}</td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {canManage && !doc.reversed_by_id && !doc.reverses_id && (
                              <ActionDropdown
                                actions={[
                                  {
                                    label: isStorno ? 'Сторно...' : 'Сторно',
                                    icon: '',
                                    color: 'red',
                                    onClick: () => handleStorno(doc.id),
                                    disabled: isStorno,
                                  },
                                ]}
                              />
                            )}
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="text-sm space-y-1">
                                {(doc.items || []).map((item) => (
                                  <div key={item.id} className="flex justify-between gap-4 text-gray-700">
                                    <span>{item.product?.name || `Товар #${item.product_id}`}</span>
                                    <span className="shrink-0">
                                      {item.quantity} × {Number(item.purchase_price || 0).toFixed(2)} ₽
                                    </span>
                                  </div>
                                ))}
                                {doc.comment && (
                                  <div className="text-gray-500 pt-1">Комментарий: {doc.comment}</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {sortedDocs.map((doc) => {
                const open = expandedId === doc.id;
                return (
                  <div key={doc.id} className="bg-white rounded-xl shadow p-4">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setExpandedId(open ? null : doc.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{doc.id}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(doc.date).toLocaleDateString('ru-RU')} · {doc.items?.length || 0} поз.
                          </div>
                          <div className="mt-1">{statusBadge(doc)}</div>
                        </div>
                        <div className={`font-bold ${Number(doc.total_amount) < 0 ? 'text-red-700' : 'text-green-800'}`}>
                          {typeof doc.total_amount === 'number' ? doc.total_amount.toFixed(2) : '—'} ₽
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">{doc.responsible_name || '—'}</div>
                    </button>
                    {open && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1">
                        {(doc.items || []).map((item) => (
                          <div key={item.id} className="flex justify-between gap-2 text-gray-700">
                            <span>{item.product?.name || `Товар #${item.product_id}`}</span>
                            <span className="shrink-0">
                              {item.quantity} × {Number(item.purchase_price || 0).toFixed(2)} ₽
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {canManage && !doc.reversed_by_id && !doc.reverses_id && (
                      <button
                        type="button"
                        onClick={() => handleStorno(doc.id)}
                        disabled={isStorno}
                        className="mt-3 w-full text-sm bg-red-50 text-red-800 px-3 py-2 rounded-lg min-h-[44px] hover:bg-red-100 disabled:opacity-50"
                      >
                        Сторно
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentEntrance;
