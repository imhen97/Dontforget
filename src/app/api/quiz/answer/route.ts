import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateNextReview, qualityFromCorrect } from '@/lib/srs'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, wordId, correct, responseTime } = await req.json()

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

  // Update streak
  await updateStreak(authUser.userId)

  return NextResponse.json({ answer, nextReview: srs.nextReview })
}

async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (user.lastStudyDay === today) return // Already counted today

  const newStreak = user.lastStudyDay === yesterday ? user.streak + 1 : 1

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastStudyDay: today },
  })
}
