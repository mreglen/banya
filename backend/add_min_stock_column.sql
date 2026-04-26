-- Добавление колонки минимального остатка для товаров
ALTER TABLE products ADD COLUMN min_stock FLOAT DEFAULT 0.0;
