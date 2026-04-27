import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetTicketQuery, useUpdateTicketStatusMutation } from '../../../redux/supportApiSlice';
import { useSupportWebSocket } from '../../../hooks/useSupportWebSocket';
import MessageBubble from './components/MessageBubble';
import ImagePreview from './components/ImagePreview';

function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.is_admin;

  const { data: ticket, isLoading, error, refetch } = useGetTicketQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateTicketStatusMutation();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  const isAdminResponseReceived = ticket?.admin_has_replied || false;
  const isTicketClosed = ticket?.status === 'closed';

  const handleWebSocketMessage = useCallback((newMessage) => {
    console.log('Received new message via WebSocket:', newMessage);
  }, []);

  // WebSocket подключение
  const { sendMessage, isConnected } = useSupportWebSocket(
    parseInt(id),
    true,
    handleWebSocketMessage
  );

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    // Проверка можно ли писать
    if (isTicketClosed) {
      alert('Нельзя писать в закрытое обращение');
      return;
    }

    if (!isAdmin && !isAdminResponseReceived) {
      alert('Дождитесь ответа администратора');
      return;
    }

    setIsSending(true);
    const messageText = message.trim();
    setMessage('');

    // Отправка через WebSocket
    const sent = sendMessage(messageText);

    // Если WebSocket не подключен, отправляем через REST
    if (!sent) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || '/api'}/support/tickets/${id}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({ message: messageText }),
          }
        );

        if (!response.ok) {
          throw new Error('Ошибка при отправке сообщения');
        }

        // Обновляем данные
        refetch();
      } catch (err) {
        console.error('Error sending message:', err);
        alert('Ошибка при отправке сообщения');
        setMessage(messageText); // Возвращаем текст сообщения
      }
    }

    setIsSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin) return;

    try {
      await updateStatus({ ticketId: id, status: newStatus }).unwrap();
      refetch();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Ошибка при обновлении статуса');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: 'В обработке',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      closed: {
        label: 'Закрыт',
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить обращение</p>
          <button
            onClick={() => navigate('/admin/support')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const API_URL = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : '';
  const attachmentImages = ticket.attachments?.map(
    (attachment) => `${API_URL}${attachment.file_path}`
  ) || [];

  // Если пользователь не админ и админ еще не ответил
  if (!isAdmin && !isAdminResponseReceived && !isTicketClosed) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/support')}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{ticket.title}</h1>
            {getStatusBadge(ticket.status)}
          </div>
          <p className="text-gray-600 mt-2">Создано: {new Date(ticket.created_at).toLocaleDateString('ru-RU')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {ticket.user_full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{ticket.user_full_name}</h3>
                <p className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleString('ru-RU')}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {attachmentImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Прикрепленные фото:</h3>
              <ImagePreview images={attachmentImages} />
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Ожидает ответа администратора</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Ваше обращение получено. Администратор ответит вам в ближайшее время.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если обращение закрыто
  if (isTicketClosed) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/support')}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{ticket.title}</h1>
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Сообщения */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {ticket.messages?.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isCurrentUser={msg.user_id === user.user_id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <div>
                <p className="text-sm text-red-800 font-medium">Обращение закрыто</p>
                <p className="text-xs text-red-700 mt-1">
                  Вы не можете писать в это обращение.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Обычный чат
  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Заголовок */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/support')}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к списку
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{ticket.title}</h1>
          <div className="flex items-center gap-3">
            {getStatusBadge(ticket.status)}
            {isAdmin && (
              <button
                onClick={() => handleStatusChange('closed')}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isUpdating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Закрыть обращение
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            ></div>
            <span>{isConnected ? 'Подключено' : 'Подключение...'}</span>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-6 mb-4 overflow-y-auto">
        {ticket.messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Сообщений пока нет</p>
          </div>
        ) : (
          <>
            {/* Карточка обращения */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {ticket.user_full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{ticket.user_full_name}</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(ticket.created_at).toLocaleString('ru-RU')}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
              {attachmentImages.length > 0 && (
                <div className="mt-3">
                  <ImagePreview images={attachmentImages} maxHeight="150px" />
                </div>
              )}
            </div>

            {/* Сообщения */}
            {ticket.messages?.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isCurrentUser={msg.user_id === user.user_id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Ввод сообщения */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className={`px-6 py-2 rounded-lg font-medium transition self-end ${
              !message.trim() || isSending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
