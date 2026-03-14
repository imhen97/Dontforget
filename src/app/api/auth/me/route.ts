export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      email: true,
      username: true,
      dailyGoal: true,
      streak: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Count today's words
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayWordsCount = await prisma.word.count({
    where: { userId: authUser.userId, createdAt: { gte: today } },
  })

  return NextResponse.json({ ...user, todayWordsCount })
}

export async function PATCH(req: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dailyGoal } = await req.json()

  if (!dailyGoal || dailyGoal < 1 || dailyGoal > 10) {
    return NextResponse.json({ error: '목표는 1~10개 사이여야 합니다' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data: { dailyGoal },
    select: { id: true, email: true, username: true, dailyGoal: true, streak: true },
  })

  return NextResponse.json(user)
}
