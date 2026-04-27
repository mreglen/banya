import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { supportApi } from '../redux/supportApiSlice';

const WS_URL = process.env.REACT_APP_API_URL?.replace('http', 'ws')?.replace('/api', '') || 'ws://localhost:8000';

/**
 * WebSocket хук для чата поддержки
 * @param {number} ticketId - ID обращения
 * @param {boolean} enabled - Включено ли подключение
 * @param {Function} onMessage - Callback при получении нового сообщения
 */
export function useSupportWebSocket(ticketId, enabled = true, onMessage = null) {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const manualClose = useRef(false);
  const onMessageRef = useRef(onMessage);
  const dispatch = useDispatch();

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!ticketId || !enabled) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
    manualClose.current = false;

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token for WebSocket connection');
      return;
    }

    try {
      // Подключение к WebSocket
      const wsUrl = `${WS_URL}/ws/support/${ticketId}?token=${token}`;
      const wsConnection = new WebSocket(wsUrl);

      wsConnection.onopen = () => {
        console.log('✅ WebSocket connected to ticket:', ticketId);
        ws.current = wsConnection;
      };

      wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message') {
            console.log('📨 New message received:', data.message);
            
            // Инвалидируем кэш для обновления данных
            dispatch(
              supportApi.util.invalidateTags([
                { type: 'SupportTicket', id: ticketId },
              ])
            );

            // Вызываем callback если передан
            if (onMessageRef.current) {
              onMessageRef.current(data.message);
            }
          } else if (data.type === 'error') {
            console.error('❌ WebSocket error:', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsConnection.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        ws.current = null;

        // Не переподключаемся после ручного закрытия или при auth/access ошибках
        if (manualClose.current || [4001, 4003, 4004].includes(event.code)) {
          return;
        }

        // Переподключение через 3 секунды
        reconnectTimeout.current = setTimeout(() => {
          console.log('🔄 Reconnecting...');
          connect();
        }, 3000);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [ticketId, enabled, dispatch]);

  const disconnect = useCallback(() => {
    manualClose.current = true;

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
      console.log('WebSocket disconnected from ticket:', ticketId);
    }
  }, [ticketId]);

  const sendMessage = useCallback(
    (message) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: 'message',
            message: message,
          })
        );
        return true;
      } else {
        console.warn('WebSocket is not connected');
        return false;
      }
    },
    []
  );

  useEffect(() => {
    if (ticketId && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [ticketId, enabled, connect, disconnect]);

  return {
    sendMessage,
    disconnect,
    isConnected: ws.current !== null && ws.current.readyState === WebSocket.OPEN,
  };
}

export default useSupportWebSocket;
