import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all users with their stats for ranking
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      streak: true,
      createdAt: true,
      _count: { select: { words: true } },
      vocabLevel: { select: { level: true, score: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Calculate scores for each user
  const usersWithScores = await Promise.all(
    users.map(async user => {
      const correctAnswers = await prisma.quizAnswer.count({
        where: { userId: user.id, correct: true },
      })

      const score = user._count.words * 10 + correctAnswers * 5 + user.streak * 20

      return {
        id: user.id,
        username: user.username,
        wordCount: user._count.words,
        correctAnswers,
        streak: user.streak,
        level: user.vocabLevel?.level || 'Beginner',
        score,
        isMe: user.id === authUser.userId,
      }
    })
  )

  // Sort by score descending, take top 100
  const sorted = usersWithScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map((u, i) => ({ ...u, rank: i + 1 }))

  // Find current user's rank
  const myRank = sorted.find(u => u.isMe)

  return NextResponse.json({ leaderboard: sorted, myRank })
}
