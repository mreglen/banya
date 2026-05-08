// src/pages/Admin/Documents/DocumentsRealization/DocumentsRealization.jsx

import { useState } from 'react';
import {
    useGetRealizationDocumentsQuery,
    useDeleteRealizationDocumentMutation,
} from '../../../../redux/slices/productsApiSlice';
import RealizationDetailsModal from './RealizationDetailsModal';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';
import DocumentsRealizationSkeleton from './DocumentsRealizationSkeleton';

function DocumentsRealization() {
    const {
        data: realizations = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useGetRealizationDocumentsQuery();

    const [deleteRealizationDocument] = useDeleteRealizationDocumentMutation();

    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleView = (doc) => {
        setSelectedDocument(doc);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить документ реализации? Это удалит всю бронь и вернёт товары на склад!')) return;
        try {
            await deleteRealizationDocument(id).unwrap();
            alert('✅ Документ успешно удалён!');
            refetch();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('❌ Не удалось удалить документ');
        }
    };

    const sortedDocs = [...realizations].sort((a, b) => new Date(b.date) - new Date(a.date));

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const formatPrice = (price) => {
        if (typeof price !== 'number') return '—';
        return `${price.toFixed(2)} ₽`;
    };

    if (isLoading) {
        return <DocumentsRealizationSkeleton />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow p-6 border border-red-100">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Документы реализации</h1>
                        <p className="text-red-700 mb-3">Не удалось загрузить документы реализации.</p>
                        <p className="text-sm text-gray-600 mb-4">
                            {error?.data?.detail || error?.error || 'Проверьте миграции базы данных и доступность backend API.'}
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

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Документы реализации</h1>
                    <p className="text-gray-600 mt-1 md:mt-2">Управление документами реализации</p>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-2xl shadow-lg mb-6">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">№</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">ФИО клиента</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">Баня</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">Дата</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">Цена</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">Статус</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedDocs.length > 0 ? (
                                sortedDocs.map((doc, index) => (
                                    <tr
                                        key={doc.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleView(doc)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.client_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.bath_name || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(doc.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatPrice(doc.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Закрыт
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <ActionDropdown
                                                actions={[
                                                    {
                                                        label: 'Просмотр',
                                                        icon: '👁️',
                                                        color: 'blue',
                                                        onClick: () => handleView(doc),
                                                    },
                                                    {
                                                        label: 'Удалить',
                                                        icon: '🗑️',
                                                        color: 'red',
                                                        onClick: () => handleDelete(doc.id),
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-lg">
                                        Нет документов реализации
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {sortedDocs.length > 0 ? (
                        sortedDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className="bg-white rounded-xl shadow p-4 border border-gray-100"
                                onClick={() => handleView(doc)}
                            >
                                <div className="font-bold text-gray-900 text-lg mb-1">#{doc.id}</div>
                                <div className="text-sm text-gray-600 mb-2">
                                    <div>👤 {doc.client_name || '—'}</div>
                                    <div>🛁 {doc.bath_name || '—'}</div>
                                    <div>📅 {formatDate(doc.date)}</div>
                                    <div>💰 {formatPrice(doc.total_amount)}</div>
                                </div>
                                <div className="flex items-center mb-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Закрыт
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(doc.id);
                                    }}
                                    className="w-full bg-red-100 text-red-800 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition mt-2"
                                >
                                    Удалить
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                            Нет документов реализации.<br />
                            Создайте бронь с товарами на странице "Записи".
                        </div>
                    )}
                </div>

                {/* View Modal */}
                {isModalOpen && selectedDocument && (
                    <RealizationDetailsModal
                        isOpen={true}
                        onClose={() => {
                            setIsModalOpen(false);
                            setSelectedDocument(null);
                        }}
                        reservation={selectedDocument}
                    />
                )}
            </div>
        </div>
    );
}

export default DocumentsRealization;