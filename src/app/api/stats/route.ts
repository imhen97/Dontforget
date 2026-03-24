export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = authUser.userId

  const [
    totalWords,
    masteredWords,
    vocabLevel,
    recentSessions,
    weeklyActivity,
    topicBreakdown,
    user,
  ] = await Promise.all([
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, mastered: true } }),
    prisma.vocabLevel.findUnique({ where: { userId } }),
    prisma.quizSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    getWeeklyActivity(userId),
    prisma.word.groupBy({
      by: ['topic'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { streak: true, dailyGoal: true } }),
  ])

  // Calculate accuracy from recent sessions
  const recentAnswers = await prisma.quizAnswer.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  })

  const totalAnswers = recentAnswers.length
  const correctAnswers = recentAnswers.filter(a => a.correct).length
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0

  // Due for review today
  const dueToday = await prisma.word.count({
    where: { userId, mastered: false, nextReview: { lte: new Date() } },
  })

  return NextResponse.json({
    totalWords,
    masteredWords,
    vocabLevel,
    recentSessions,
    weeklyActivity,
    topicBreakdown: topicBreakdown.map(t => ({ topic: t.topic || 'General', count: t._count.id })),
    accuracy,
    dueToday,
    streak: user?.streak || 0,
    dailyGoal: user?.dailyGoal || 5,
  })
}

async function getWeeklyActivity(userId: string) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const [added, quizzed] = await Promise.all([
      prisma.word.count({ where: { userId, createdAt: { gte: date, lt: nextDate } } }),
      prisma.quizAnswer.count({ where: { userId, createdAt: { gte: date, lt: nextDate } } }),
    ])

    days.push({
      date: date.toISOString().split('T')[0],
      label: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      added,
      quizzed,
    })
  }
  return days
}
