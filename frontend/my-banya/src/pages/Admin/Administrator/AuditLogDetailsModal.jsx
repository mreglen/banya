import { useState } from 'react';

function AuditLogDetailsModal({ log, onClose }) {
  if (!log) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    const labels = {
      'CREATE': 'Создание',
      'UPDATE': 'Изменение',
      'DELETE': 'Удаление'
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Детали действия</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Основное описание */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-base md:text-lg text-gray-800 font-medium">
              {log.summary || 'Нет описания'}
            </p>
          </div>
          
          {/* Тип действия */}
          <div>
            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getActionColor(log.action)}`}>
              {getActionLabel(log.action)}
            </span>
          </div>
          
          {/* Мета-информация */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Время действия:</div>
              <div className="text-sm md:text-base font-medium text-gray-800">
                {formatDateTime(log.created_at)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Пользователь:</div>
              <div className="text-sm md:text-base font-medium text-gray-800">
                {log.user_full_name || '-'}
              </div>
            </div>
            
            {log.bath_name && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Баня:</div>
                <div className="text-sm md:text-base font-medium text-gray-800">
                  {log.bath_name}
                </div>
              </div>
            )}
            
            {log.client_name && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Клиент:</div>
                <div className="text-sm md:text-base font-medium text-gray-800">
                  {log.client_name}
                </div>
              </div>
            )}
            
            {log.event_datetime && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Дата события:</div>
                <div className="text-sm md:text-base font-medium text-gray-800">
                  {formatDateTime(log.event_datetime)}
                </div>
              </div>
            )}
            
            {log.entity_type && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Тип сущности:</div>
                <div className="text-sm md:text-base font-medium text-gray-800 capitalize">
                  {log.entity_type}
                </div>
              </div>
            )}
          </div>
          
          {/* Список товаров */}
          {log.product_list && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Товары:</div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm md:text-base text-gray-800">
                  {log.product_list}
                </div>
              </div>
            </div>
          )}
          
          {/* Дополнительные details из JSON */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Дополнительная информация:</div>
              <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs md:text-sm overflow-auto max-h-40">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Техническая информация */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Техническая информация:</div>
            <div className="text-xs md:text-sm text-gray-600 space-y-1">
              {log.ip_address && (
                <div>
                  <span className="font-medium">IP:</span> {log.ip_address}
                </div>
              )}
              {log.entity_id && (
                <div>
                  <span className="font-medium">ID сущности:</span> {log.entity_id}
                </div>
              )}
              {log.user_agent && (
                <div className="break-all">
                  <span className="font-medium">User Agent:</span> {log.user_agent}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 md:py-3 rounded-lg transition-colors font-medium text-sm md:text-base"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuditLogDetailsModal;
