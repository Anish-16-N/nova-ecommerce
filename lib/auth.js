import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// The signing secret comes from the environment only. It is read when a token is
// signed or checked, not at import time, so `next build` works without it.
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set');
  return value;
}

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
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
