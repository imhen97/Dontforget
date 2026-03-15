import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { auth } from '@/../auth'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production-32ch'
)

export interface JWTPayload {
  userId: string
  username: string
  email: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    userId: session.user.id,
    username: session.user.name ?? '',
    email: session.user.email ?? '',
  }
}

export async function getAuthUserFromRequest(_req: NextRequest): Promise<JWTPayload | null> {
  return getAuthUser()
}
