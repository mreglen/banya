-- SQL миграция для создания таблиц чата поддержки
-- Выполнить в PostgreSQL

-- Таблица обращений в поддержку
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Таблица сообщений в чате поддержки
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    message TEXT NOT NULL,
    is_from_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица вложений к обращениям
CREATE TABLE support_ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at ASC);

CREATE INDEX idx_support_ticket_attachments_ticket_id ON support_ticket_attachments(ticket_id);

-- Комментарии для таблиц
COMMENT ON TABLE support_tickets IS 'Обращения пользователей в поддержку';
COMMENT ON TABLE support_messages IS 'Сообщения в чате поддержки';
COMMENT ON TABLE support_ticket_attachments IS 'Вложения (фото) к обращениям';
