import { auth } from '../../../../lib/auth';
import { pool } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// One of the signed-in customer's orders.  GET /api/orders/<uuid>
export async function GET(request, { params }) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const id = params.id;
  const { rows } = await pool.query(
    'SELECT id, order_number, status, total_amount, shipping_address, created_at FROM orders WHERE id = $1',
    [id],
  );
  if (!rows[0]) return new Response('Not found', { status: 404 });
  return Response.json({ order: rows[0] });
}
