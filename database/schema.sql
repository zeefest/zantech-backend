-- ============================================================
-- ZANTECH MART - PostgreSQL Schema
-- ============================================================

DROP TABLE IF EXISTS sales, order_items, orders, carts, products, users CASCADE;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'Customer'
                    CHECK (role IN ('Admin', 'Customer')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    purchase_price  DECIMAL(10, 2) NOT NULL CHECK (purchase_price >= 0),
    sales_price     DECIMAL(10, 2) NOT NULL CHECK (sales_price >= 0),
    description     TEXT,
    category        VARCHAR(100),
    image_url       VARCHAR(500),
    is_listed       BOOLEAN DEFAULT TRUE,
    stock           INTEGER DEFAULT 100,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_listed   ON products(is_listed);

-- ============================================================
-- CARTS TABLE
-- ============================================================
CREATE TABLE carts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount    DECIMAL(10, 2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL CHECK (payment_method IN ('Card', 'Cash')),
    status          VARCHAR(20) NOT NULL DEFAULT 'Confirmed'
                    CHECK (status IN ('Confirmed','Packaging','Dispatched','Delivered')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE order_items (
    id                  SERIAL PRIMARY KEY,
    order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          INTEGER NOT NULL REFERENCES products(id),
    quantity            INTEGER NOT NULL,
    price_at_purchase   DECIMAL(10, 2) NOT NULL
);

-- ============================================================
-- SALES TABLE  (auto-populated on order placement)
-- ============================================================
CREATE TABLE sales (
    id                  SERIAL PRIMARY KEY,
    order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    total_sales_price   DECIMAL(10, 2) NOT NULL,
    total_profit        DECIMAL(10, 2) NOT NULL,
    sale_date           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);