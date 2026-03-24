export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateNextReview, qualityFromCorrect } from '@/lib/srs'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, wordId, correct, responseTime } = await req.json() as any

  const word = await prisma.word.findFirst({
    where: { id: wordId, userId: authUser.userId },
  })

  if (!word) return NextResponse.json({ error: 'Word not found' }, { status: 404 })

  const quality = qualityFromCorrect(correct, responseTime)

  // Update SRS
  const srs = calculateNextReview(quality, word.repetitions, word.easeFactor, word.interval)

  await prisma.word.update({
    where: { id: wordId },
    data: {
      easeFactor: srs.nextEaseFactor,
      interval: srs.nextInterval,
      repetitions: srs.nextRepetitions,
      nextReview: srs.nextReview,
    },
  })

  // Save answer
  const answer = await prisma.quizAnswer.create({
    data: {
      sessionId,
      wordId,
      userId: authUser.userId,
      correct,
      quality,
    },
  })

  // 냥 획득 (정답 +2냥)
  if (correct) {
    try {
      const u = await prisma.user.findUnique({ where: { id: authUser.userId }, select: { nyang: true } })
      if (u != null) {
        await prisma.user.update({
          where: { id: authUser.userId },
          data: { nyang: (u.nyang ?? 0) + 2 },
        })
      }
    } catch (err) {
      console.error('[quiz/answer] nyang update:', err)
    }
  }

  // Update streak
  await updateStreak(authUser.userId)

  return NextResponse.json({ answer, nextReview: srs.nextReview, nyangEarned: correct ? 2 : 0 })
}

async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() + 9 * 3600000 - 86400000).toISOString().slice(0, 10)

  if (user.lastStudyDay === today) return // Already counted today

  const newStreak = user.lastStudyDay === yesterday ? user.streak + 1 : 1

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastStudyDay: today },
  })
}
