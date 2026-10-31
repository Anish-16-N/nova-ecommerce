// Security Lab Database Layer with In-Memory Simulation
import { Pool } from 'pg';

const baseConfig = {
  host: process.env.LAB_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LAB_DB_PORT || '5432', 10),
  database: process.env.LAB_DB_NAME || 'nova_db',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 1500,
};

let pool = null;
try {
  pool = new Pool({
    ...baseConfig,
    user: process.env.DB_DEMO_USER || 'nova_demo_readonly',
    password: process.env.DB_DEMO_PASSWORD,
  });
  pool.on('error', () => {});
} catch (e) {
  pool = null;
}

export const demoStore = {
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
    { id: 5, name: 'Demo Air Fryer', category: 'Home', price: 8499, stock: 35, description: 'Demo kitchen appliance.', internal_cost: 4000, supplier_code: 'SUP-010' },
    { id: 6, name: "O'Brien's Signature Irish Tea", category: 'Home', price: 399, stock: 100, description: 'Apostrophe test product for Route C check.', internal_cost: 150, supplier_code: 'SUP-021' }
  ],
  reviews: [
    { id: 1, product_id: 1, reviewer_name: 'Happy Customer', content: 'Great product! Works exactly as described.', rating: 5, is_demo: true, created_at: new Date() },
    { id: 2, product_id: 2, reviewer_name: 'XSS Demo User', content: '<img src=x onerror="alert(\'Stored XSS!\')">', rating: 3, is_demo: true, created_at: new Date() },
    { id: 3, product_id: 3, reviewer_name: 'Script Tester', content: '<b style="color:red">This text is bold and red</b> — demonstrates HTML injection in reviews.', rating: 4, is_demo: true, created_at: new Date() }
  ]
};

let labIsMock = false;

export async function runLabQuery(text, params = []) {
  if (labIsMock) {
    return await handleLabMock(text, params);
  }
  try {
    if (!pool) return await handleLabMock(text, params);
    return await pool.query(text, params);
  } catch (err) {
    labIsMock = true;
    return await handleLabMock(text, params);
  }
}

async function handleLabMock(text, params = []) {
  const t = text.trim();
  const lower = t.toLowerCase();

  // Test connection
  if (t.includes('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString(), db: 'nova_lab_inmemory' }] };
  }

  // Time-based Blind SQLi (pg_sleep simulation)
  if (lower.includes('pg_sleep(')) {
    const sleepMatch = lower.match(/pg_sleep\(\s*(\d+)\s*\)/);
    const seconds = sleepMatch ? Math.min(parseInt(sleepMatch[1], 10), 8) : 2;
    await new Promise(r => setTimeout(r, seconds * 1000));
    return {
      rows: [{ id: 1, name: `[TIME DELAY SUCCESSFUL — Delayed by ${seconds}s]`, price: '9999', category: 'Time-Based' }],
      rowCount: 1,
      delayedSeconds: seconds
    };
  }

  // Error-based SQLi (data exfiltration via type cast errors)
  if (lower.includes('cast(') && (lower.includes('as int') || lower.includes('as integer'))) {
    throw new Error('invalid input syntax for type integer: "admin:admin123"');
  }

  // Demo customers (SQLi Login)
  if (t.includes('demo_customers')) {
    if (params && params.length >= 2) {
      const u = demoStore.customers.find(c => c.username === params[0] && (c.password === params[1] || params[1] === 'admin123'));
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }

    const singleQuotes = (t.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0 && !t.includes('--')) {
      throw new Error(`syntax error at or near "'": unterminated quoted string at or near "'"`);
    }

    if (lower.includes('select count(*)')) {
      if (lower.includes('1=2') || lower.includes('false') || lower.includes("'a'='b'")) {
        return { rows: [{ count: '0' }], rowCount: 1 };
      }
      return { rows: [{ count: '1' }], rowCount: 1 };
    }

    if (
      lower.includes("admin'") ||
      lower.includes("' or '1'='1") ||
      lower.includes("1=1") ||
      lower.includes("' or 'x'='x") ||
      lower.includes("' or true") ||
      lower.includes("' or ''='")
    ) {
      return { rows: [demoStore.customers[0]], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }

  // Demo products (SQLi Search)
  if (t.includes('demo_products')) {
    if (params && params.length > 0) {
      const q = String(params[0]).replace(/%/g, '').toLowerCase();
      const rows = demoStore.products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      return { rows, rowCount: rows.length };
    }

    const singleQuotes = (t.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0 && !t.includes('--')) {
      throw new Error(`syntax error at or near "'": unterminated quoted string at or near "'"`);
    }

    if (lower.includes('union') && (lower.includes('select') || lower.includes('demo_customers'))) {
      const leakedRows = demoStore.customers.map(c => ({
        id: c.id,
        name: `[LEAKED CREDENTIAL] User: ${c.username} | Pass: ${c.password}`,
        price: String(c.loyalty_points),
        category: c.email
      }));
      return { rows: [...demoStore.products, ...leakedRows], rowCount: demoStore.products.length + leakedRows.length };
    }

    if (
      lower.includes("' or '1'='1") ||
      lower.includes("1=1") ||
      lower.includes("' or 'x'='x") ||
      lower.includes("' or true") ||
      lower.includes("name ilike '%%'")
    ) {
      return { rows: demoStore.products, rowCount: demoStore.products.length };
    }

    const match = t.match(/ILIKE\s+'%([^%]*)%'/i);
    if (match) {
      const searchWord = match[1].toLowerCase();
      const rows = demoStore.products.filter(p => p.name.toLowerCase().includes(searchWord) || p.category.toLowerCase().includes(searchWord));
      return { rows, rowCount: rows.length };
    }

    return { rows: demoStore.products, rowCount: demoStore.products.length };
  }

  // Demo reviews
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

