import { auth } from '../../../lib/auth';
import { pool } from '../../../lib/db';

export const dynamic = 'force-dynamic';

// The signed-in user's own profile.
export async function GET() {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { rows } = await pool.query(
    'SELECT id, email, username, full_name, role FROM users WHERE id = $1',
    [session.user.id],
  );
  if (!rows[0]) return new Response('Not found', { status: 404 });
  return Response.json({ user: rows[0] });
}
