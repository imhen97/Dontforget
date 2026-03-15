
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { QuizQuestion } from '../daily/route'

// POST /api/quiz/extra - create a new quiz session
export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, topic } = await req.json() // type: "weekly_wrong" | "random" | "topic"

  let words: Array<{ id: string; word: string; translation: string; exampleEn: string }>

  if (type === 'weekly_wrong') {
    // Words answered wrong in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const wrongAnswers = await prisma.quizAnswer.findMany({
      where: {
        userId: authUser.userId,
        correct: false,
        createdAt: { gte: sevenDaysAgo },
      },
      include: { word: true },
      distinct: ['wordId'],
      take: 20,
    })
    words = wrongAnswers.map(a => a.word)
  } else if (type === 'topic' && topic) {
    words = await prisma.word.findMany({
      where: { userId: authUser.userId, topic, mastered: false },
      take: 20,
    })
  } else {
    // random
    words = await prisma.word.findMany({
      where: { userId: authUser.userId, mastered: false },
      take: 20,
    })
    words = words.sort(() => Math.random() - 0.5)
  }

  if (words.length === 0) {
    return NextResponse.json({ questions: [], message: '해당 조건의 단어가 없습니다.' })
  }

  // Create session
  const session = await prisma.quizSession.create({
    data: { userId: authUser.userId, type, total: words.length },
  })

  const allWords = await prisma.word.findMany({
    where: { userId: authUser.userId },
    select: { id: true, word: true, translation: true },
  })

  const questions: QuizQuestion[] = words.map(word => buildQuestion(word, allWords))

  return NextResponse.json({ sessionId: session.id, questions })
}

// GET /api/quiz/extra - start daily session
export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await prisma.quizSession.create({
    data: { userId: authUser.userId, type: 'daily', total: 0 },
  })

  return NextResponse.json({ sessionId: session.id })
}

// PATCH - update session score
export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, score, total } = await req.json()

  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId: authUser.userId },
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.quizSession.update({
    where: { id: sessionId },
    data: { score, total },
  })

  return NextResponse.json(updated)
}

function buildQuestion(
  word: { id: string; word: string; translation: string; exampleEn: string },
  allWords: { id: string; word: string; translation: string }[]
): QuizQuestion {
  const questionTypes: Array<'en_to_ko' | 'ko_to_en' | 'fill_blank'> = ['en_to_ko', 'ko_to_en', 'fill_blank']
  const type = questionTypes[Math.floor(Math.random() * questionTypes.length)]

  const others = allWords.filter(w => w.id !== word.id)
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3)

  let choices: string[]
  let correctIndex: number

  if (type === 'en_to_ko' || type === 'fill_blank') {
    const distractors = shuffled.map(w => w.translation)
    choices = [...distractors, word.translation].sort(() => Math.random() - 0.5)
    correctIndex = choices.indexOf(word.translation)
  } else {
    const distractors = shuffled.map(w => w.word)
    choices = [...distractors, word.word].sort(() => Math.random() - 0.5)
    correctIndex = choices.indexOf(word.word)
  }

  while (choices.length < 4) {
    choices.push(`보기 ${choices.length + 1}`)
  }

  return { wordId: word.id, word: word.word, translation: word.translation, exampleEn: word.exampleEn, type, choices, correctIndex }
}
