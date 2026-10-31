
-- =============================================
-- NOVA E-Commerce - Master Database Schema
-- =============================================
-- PostgreSQL 15+
-- Initialization order:
-- 01_schema.sql -> 02_seed.sql -> 03_demo_seed.sql
--
-- IMPORTANT:
-- This file is executed using PostgreSQL's psql client.
-- All demonstration records must be synthetic.

-- =============================================
-- 1. REQUIRED EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- =============================================
-- 2. DEMO READ-ONLY DATABASE ROLE
-- =============================================
-- The password is supplied through the Docker environment.
-- No database password is hardcoded in this file.

\getenv demo_db_password DB_DEMO_PASSWORD

SELECT format(
    'CREATE ROLE nova_demo_readonly LOGIN PASSWORD %L',
    :'demo_db_password'
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_roles
    WHERE rolname = 'nova_demo_readonly'
)
\gexec


-- =============================================
-- 3. CATEGORIES
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    slug          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    icon          VARCHAR(50),
    image_url     TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================
-- 4. USERS
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    phone         VARCHAR(20),
    avatar_url    TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'customer',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_username
    ON users(username);


-- =============================================
-- 5. ADDRESSES
-- =============================================

CREATE TABLE IF NOT EXISTS addresses (
    id            SERIAL PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) NOT NULL,
    pin_code      VARCHAR(10) NOT NULL,
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================
-- 6. PRODUCTS
-- =============================================

CREATE TABLE IF NOT EXISTS products (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    description         TEXT,
    short_description   VARCHAR(500),
    category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand               VARCHAR(100),
    sku                 VARCHAR(100),
    price               DECIMAL(10,2),
    compare_price       DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    rating              DECIMAL(3,2) NOT NULL DEFAULT 0,
    total_reviews       INTEGER NOT NULL DEFAULT 0,
    stock_quantity      INTEGER NOT NULL DEFAULT 0,
    image_url           TEXT,
    images              JSONB NOT NULL DEFAULT '[]',
    specifications      JSONB NOT NULL DEFAULT '{}',
    tags                TEXT[],
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_best_seller      BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_arrival      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_active
    ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_products_price
    ON products(price);

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
    ON products USING gin(name gin_trgm_ops)
    WHERE is_active = TRUE;


-- =============================================
-- 7. PRODUCT REVIEWS
-- =============================================

CREATE TABLE IF NOT EXISTS reviews (
    id                   SERIAL PRIMARY KEY,
    product_id           INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
    username             VARCHAR(100),
    full_name            VARCHAR(255),
    rating               INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title                VARCHAR(255),
    body                 TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved          BOOLEAN NOT NULL DEFAULT TRUE,
    helpful_count        INTEGER NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product
    ON reviews(product_id);


-- =============================================
-- 8. CART ITEMS
-- =============================================

CREATE TABLE IF NOT EXISTS cart_items (
    id         SERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_user_product
    ON cart_items(user_id, product_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_session_product
    ON cart_items(session_id, product_id)
    WHERE session_id IS NOT NULL AND user_id IS NULL;


-- =============================================
-- 9. WISHLIST ITEMS
-- =============================================

CREATE TABLE IF NOT EXISTS wishlist_items (
    id         SERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wish_user_product
    ON wishlist_items(user_id, product_id)
    WHERE user_id IS NOT NULL;


-- =============================================
-- 10. ORDERS
-- =============================================

CREATE SEQUENCE IF NOT EXISTS order_seq
    START 1000
    INCREMENT 1;

CREATE TABLE IF NOT EXISTS orders (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number      VARCHAR(25) NOT NULL UNIQUE,
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id        VARCHAR(255),
    status            VARCHAR(30) NOT NULL DEFAULT 'pending',
    subtotal          DECIMAL(10,2) NOT NULL,
    discount_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_fee      DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount      DECIMAL(10,2) NOT NULL,
    shipping_address  JSONB NOT NULL,
    estimated_delivery DATE,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user
    ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_number
    ON orders(order_number);


-- =============================================
-- 11. AUTOMATIC ORDER NUMBER GENERATION
-- =============================================

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.order_number :=
        'NOV-' ||
        TO_CHAR(NOW(), 'YYYYMMDD') ||
        '-' ||
        LPAD(NEXTVAL('order_seq')::TEXT, 4, '0');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_number ON orders;

CREATE TRIGGER trg_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION set_order_number();


-- =============================================
-- 12. ORDER ITEMS
-- =============================================

CREATE TABLE IF NOT EXISTS order_items (
    id                  SERIAL PRIMARY KEY,
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name        VARCHAR(255) NOT NULL,
    product_image       TEXT,
    brand               VARCHAR(100),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price          DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    final_price         DECIMAL(10,2) NOT NULL
);


-- =============================================
-- 13. MOCK PAYMENT TRANSACTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS mock_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    transaction_id  VARCHAR(60) NOT NULL UNIQUE,
    payment_method  VARCHAR(50) NOT NULL,
    payment_details JSONB NOT NULL DEFAULT '{}',
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store only simulated payment metadata.
-- Never store real card details, CVVs, UPI PINs or banking credentials.


-- =============================================
-- 14. RECENTLY VIEWED PRODUCTS
-- =============================================

CREATE TABLE IF NOT EXISTS recently_viewed (
    id         SERIAL PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================
-- 15. UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_updated_at();


-- =============================================
-- 16. SECURITY LAB TABLES
-- Synthetic data only.
-- =============================================

-- Demo customers for isolated SQL injection demonstrations.

CREATE TABLE IF NOT EXISTS demo_customers (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(100) NOT NULL UNIQUE,
    password       VARCHAR(100) NOT NULL,
    email          VARCHAR(255),
    full_name      VARCHAR(255),
    account_type   VARCHAR(20) NOT NULL DEFAULT 'regular',
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    customer_since DATE
);

-- Demo products for isolated SQL injection demonstrations.

CREATE TABLE IF NOT EXISTS demo_products (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    category      VARCHAR(100),
    price         DECIMAL(10,2),
    stock         INTEGER,
    description   TEXT,
    internal_cost DECIMAL(10,2),
    supplier_code VARCHAR(50)
);

-- Demo reviews for isolated XSS demonstrations.
-- Any raw HTML must remain within the isolated security lab.

CREATE TABLE IF NOT EXISTS demo_reviews (
    id            SERIAL PRIMARY KEY,
    product_id    INTEGER,
    reviewer_name VARCHAR(255),
    content       TEXT NOT NULL,
    rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
    is_demo       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================
-- 17. READ-ONLY SECURITY LAB PERMISSIONS
-- =============================================

GRANT CONNECT ON DATABASE nova_db
    TO nova_demo_readonly;

GRANT USAGE ON SCHEMA public
    TO nova_demo_readonly;

GRANT SELECT ON
    demo_customers,
    demo_products,
    demo_reviews
    TO nova_demo_readonly;

-- Explicitly do not grant access to:
-- users
-- addresses
-- orders
-- order_items
-- mock_transactions
-- cart_items
-- wishlist_items

-- No INSERT, UPDATE, DELETE or schema modification
-- permissions are granted to the demonstration role.
