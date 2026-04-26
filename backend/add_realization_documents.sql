-- Создание таблиц для документов реализации

CREATE TABLE realization_documents (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reservation_id INTEGER NOT NULL REFERENCES reservations(reservation_id),
    client_name VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    total_amount FLOAT NOT NULL DEFAULT 0.0
);

CREATE TABLE realization_document_items (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES realization_documents(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price FLOAT NOT NULL
);

CREATE INDEX idx_realization_doc_reservation ON realization_documents(reservation_id);
CREATE INDEX idx_realization_doc_items_doc ON realization_document_items(document_id);
CREATE INDEX idx_realization_doc_items_product ON realization_document_items(product_id);
