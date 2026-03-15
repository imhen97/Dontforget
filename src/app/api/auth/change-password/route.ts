import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const currentPassword = body.currentPassword as string
  const newPassword = body.newPassword as string

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: '새 비밀번호는 6자 이상이어야 해요' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, password: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.password) {
    return NextResponse.json({ error: '이메일로 가입한 계정만 비밀번호를 변경할 수 있어요' }, { status: 400 })
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: '현재 비밀번호가 맞지 않아요' }, { status: 401 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: authUser.userId },
    data: { password: hashedPassword },
  })

  return NextResponse.json({ success: true })
}
