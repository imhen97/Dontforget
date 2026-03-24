export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as any

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const arr = new Uint8Array(8)
    crypto.getRandomValues(arr)
    const tempUsername = `u_${Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')}`

    const user = await prisma.user.create({
      data: { email, username: tempUsername, password: hashedPassword, nicknameSet: false },
    })

    // Create initial vocab level entry
    await prisma.vocabLevel.create({
      data: { userId: user.id },
    })

    const token = await signToken({ userId: user.id, username: user.username, email: user.email })

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, dailyGoal: user.dailyGoal },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
