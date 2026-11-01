import { pool } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

// Admin: take a product off sale.  DELETE /api/admin/products/12
export async function DELETE(request, { params }) {
  const { rows } = await pool.query(
    'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id',
    [Number(params.id)],
  );
  if (!rows[0]) return new Response('Not found', { status: 404 });
  return Response.json({ removed: rows[0].id });
}
