import { pool } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Public product search: /api/products/search?q=phone
export async function GET(request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const sql = `SELECT id, name, slug, price FROM products WHERE is_active = TRUE AND name ILIKE '%${q}%' ORDER BY name LIMIT 20`;
  const { rows } = await pool.query(sql);
  return Response.json({ products: rows });
}
