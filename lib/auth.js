import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'weak-demo-secret-123', { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'weak-demo-secret-123');
  } catch (e) {
    return null;
  }
}

export function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('nova_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (e) {
    return null;
  }
}

// Session accessor for route handlers, shaped like NextAuth's auth():
// returns { user } for a signed-in visitor, or null.
export async function auth() {
  const user = getCurrentUser();
  return user ? { user } : null;
}
