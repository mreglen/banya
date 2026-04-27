import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function MessageBubble({ message, isCurrentUser }) {
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: ru });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня';
    } else if (diffDays === 1) {
      return 'Вчера';
    } else {
      return format(date, 'dd MMMM yyyy', { locale: ru });
    }
  };

  return (
    <div
      className={`flex ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      } mb-4 animate-fade-in`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isCurrentUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 shadow-md rounded-bl-sm border border-gray-200'
        }`}
      >
        {!isCurrentUser && (
          <div
            className={`text-xs font-semibold mb-1 ${
              isCurrentUser ? 'text-indigo-200' : 'text-indigo-600'
            }`}
          >
            {message.user_full_name}
          </div>
        )}
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </div>
        
        <div
          className={`text-xs mt-2 ${
            isCurrentUser ? 'text-indigo-200' : 'text-gray-500'
          }`}
        >
          {formatMessageTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
