/**
 * NOVA Security Lab — Lab Database Connection Pools with In-Memory Fallback
 */

'use strict';

const { Pool } = require('pg');

const baseConfig = {
  host: process.env.LAB_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LAB_DB_PORT || '5432', 10),
  database: process.env.LAB_DB_NAME || 'nova_db',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 1500,
};

let adminPool = null;
let readonlyPool = null;

try {
  adminPool = new Pool({
    ...baseConfig,
    user: process.env.DB_USER || 'nova_admin',
    password: process.env.DB_PASSWORD,
  });
  adminPool.on('error', () => { });

  readonlyPool = new Pool({
    ...baseConfig,
    user: process.env.DB_DEMO_USER || 'nova_demo_readonly',
    password: process.env.DB_DEMO_PASSWORD,
  });
  readonlyPool.on('error', () => { });
} catch (e) {
  adminPool = null;
  readonlyPool = null;
}

// ─── Synthetic In-Memory Lab Data ─────────────────────────────────────────────
const demoStore = {
  customers: [
    { id: 1, username: 'admin', password: 'admin123', email: 'admin@nova-demo.local', full_name: 'Admin User', account_type: 'admin', loyalty_points: 9999, customer_since: '2020-01-15' },
    { id: 2, username: 'john_doe', password: 'password123', email: 'john@nova-demo.local', full_name: 'John Doe', account_type: 'regular', loyalty_points: 1500, customer_since: '2021-03-22' },
    { id: 3, username: 'jane_smith', password: 'jane2024', email: 'jane@nova-demo.local', full_name: 'Jane Smith', account_type: 'premium', loyalty_points: 4200, customer_since: '2020-07-10' },
    { id: 4, username: 'raj_patel', password: 'raj@shop', email: 'raj@nova-demo.local', full_name: 'Raj Patel', account_type: 'regular', loyalty_points: 320, customer_since: '2022-11-05' },
    { id: 5, username: 'priya_k', password: 'priya123', email: 'priya@nova-demo.local', full_name: 'Priya Krishnan', account_type: 'regular', loyalty_points: 890, customer_since: '2021-09-18' }
  ],
  products: [
    { id: 1, name: 'Demo Smartphone X1', category: 'Electronics', price: 15999, stock: 45, description: 'Demo smartphone for lab testing.', internal_cost: 8000, supplier_code: 'SUP-001' },
    { id: 2, name: 'Demo Laptop Pro', category: 'Electronics', price: 54999, stock: 12, description: 'Demo laptop for SQL injection demo.', internal_cost: 28000, supplier_code: 'SUP-002' },
    { id: 3, name: 'Demo Headphones Z', category: 'Electronics', price: 4999, stock: 78, description: 'Demo wireless headphones.', internal_cost: 2000, supplier_code: 'SUP-003' },
    { id: 4, name: 'Demo Running Shoes', category: 'Sports', price: 3499, stock: 90, description: 'Demo sports shoes.', internal_cost: 1500, supplier_code: 'SUP-004' },
    { id: 5, name: 'Demo Air Fryer', category: 'Home', price: 8499, stock: 35, description: 'Demo kitchen appliance.', internal_cost: 4000, supplier_code: 'SUP-010' }
  ],
  reviews: [
    { id: 1, product_id: 1, reviewer_name: 'Happy Customer', content: 'Great product! Works exactly as described.', rating: 5, is_demo: true, created_at: new Date() },
    { id: 2, product_id: 2, reviewer_name: 'XSS Demo User', content: '<img src=x onerror="document.getElementById(\'xss-indicator\').style.background=\'red\'; document.getElementById(\'xss-indicator\').innerText=\'⚠️ Stored XSS Executed!\'">', rating: 3, is_demo: true, created_at: new Date() },
    { id: 3, product_id: 3, reviewer_name: 'Script Tester', content: '<b style="color:red">This text is bold and red</b> — demonstrates HTML injection in reviews.', rating: 4, is_demo: true, created_at: new Date() }
  ]
};

let labIsMock = false;

// Universal lab query executor
async function runLabQuery(pool, text, params = []) {
  if (labIsMock) {
    return handleLabMock(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
      if (!labIsMock) {
        labIsMock = true;
        console.log('[LabDB] ⚠️  PostgreSQL offline on 5432 — Lab using In-Memory Fallback tables.');
      }
      return handleLabMock(text, params);
    }
    throw err;
  }
}

function handleLabMock(text, params = []) {
  const t = text.trim();

  // Test connection
  if (t.includes('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString(), db: 'nova_lab_inmemory' }] };
  }

  // Demo customers (SQLi Login)
  if (t.includes('demo_customers')) {
    // If SQL injection bypass condition is detected in raw query (e.g. ' OR '1'='1 or ' OR 1=1)
    if (t.includes("'1'='1") || t.includes("1=1") || t.includes("' OR '") || t.includes("admin'--")) {
      return { rows: [demoStore.customers[0]], rowCount: 1 };
    }
    // Normal query with parameters or plain string comparison
    if (params.length >= 2) {
      const u = demoStore.customers.find(c => c.username === params[0] && c.password === params[1]);
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }
    return { rows: demoStore.customers, rowCount: demoStore.customers.length };
  }

  // Demo products (SQLi Search)
  if (t.includes('demo_products')) {
    if (t.includes("' OR '1'='1") || t.includes("1=1") || (params[0] && params[0].includes("1=1"))) {
      return { rows: demoStore.products, rowCount: demoStore.products.length };
    }
    if (params.length > 0 && typeof params[0] === 'string') {
      const q = params[0].replace(/%/g, '').toLowerCase();
      const rows = demoStore.products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      return { rows, rowCount: rows.length };
    }
    return { rows: demoStore.products, rowCount: demoStore.products.length };
  }

  // Demo reviews (XSS store/read)
  if (t.includes('INSERT INTO demo_reviews')) {
    const newRev = {
      id: demoStore.reviews.length + 1,
      product_id: parseInt(params[0], 10) || 1,
      reviewer_name: params[1] || 'Anonymous',
      content: params[2] || '',
      rating: parseInt(params[3], 10) || 5,
      is_demo: true,
      created_at: new Date()
    };
    demoStore.reviews.unshift(newRev);
    return { rows: [newRev], rowCount: 1 };
  }

  if (t.includes('FROM demo_reviews')) {
    return { rows: demoStore.reviews, rowCount: demoStore.reviews.length };
  }

  return { rows: [], rowCount: 0 };
}

// Wrapper pools
const safeAdminPool = {
  query: (text, params) => runLabQuery(adminPool, text, params)
};
const safeReadonlyPool = {
  query: (text, params) => runLabQuery(readonlyPool, text, params)
};

async function testLabConnections() {
  try {
    const res = await safeAdminPool.query('SELECT NOW() AS now, current_database() AS db');
    return { adminOk: true, readonlyOk: true, db: res.rows[0].db };
  } catch (err) {
    return { adminOk: true, readonlyOk: true, db: 'in-memory-fallback' };
  }
}

module.exports = {
  adminPool: safeAdminPool,
  readonlyPool: safeReadonlyPool,
  testLabConnections,
  demoStore,
};
