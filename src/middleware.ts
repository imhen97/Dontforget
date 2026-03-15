import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 인증은 각 페이지·API에서 처리. Edge에서 Prisma/세션 이슈로 미들웨어 인증 제거.
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
