import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface QuizQuestion {
  wordId: string
  word: string
  translation: string
  exampleEn: string
  type: 'en_to_ko' | 'ko_to_en' | 'fill_blank'
  choices: string[]
  correctIndex: number
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()

  // Get words due for review (SRS)
  const dueWords = await prisma.word.findMany({
    where: {
      userId: authUser.userId,
      mastered: false,
      nextReview: { lte: now },
    },
    orderBy: { nextReview: 'asc' },
    take: 20,
  })

  // If fewer than 5 due words, supplement with recent words
  let quizWords = dueWords
  if (dueWords.length < 5) {
    const extra = await prisma.word.findMany({
      where: {
        userId: authUser.userId,
        mastered: false,
        id: { notIn: dueWords.map(w => w.id) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10 - dueWords.length,
    })
    quizWords = [...dueWords, ...extra]
  }

  if (quizWords.length === 0) {
    return NextResponse.json({ questions: [], message: '퀴즈할 단어가 없습니다. 단어를 추가해주세요!' })
  }

  // Get all user words for distractors
  const allWords = await prisma.word.findMany({
    where: { userId: authUser.userId },
    select: { id: true, word: true, translation: true },
  })

  const questions = quizWords.map(word => buildQuestion(word, allWords))

  return NextResponse.json({ questions, dueCount: dueWords.length })
}

function buildQuestion(
  word: { id: string; word: string; translation: string; exampleEn: string },
  allWords: { id: string; word: string; translation: string }[]
): QuizQuestion {
  const questionTypes: Array<'en_to_ko' | 'ko_to_en' | 'fill_blank'> = ['en_to_ko', 'ko_to_en', 'fill_blank']
  const type = questionTypes[Math.floor(Math.random() * questionTypes.length)]

  // Get distractors (other words)
  const others = allWords.filter(w => w.id !== word.id)
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3)

  let choices: string[]
  let correctIndex: number

  if (type === 'en_to_ko' || type === 'fill_blank') {
    const distractors = shuffled.map(w => w.translation)
    choices = [...distractors, word.translation].sort(() => Math.random() - 0.5)
    correctIndex = choices.indexOf(word.translation)
  } else {
    // ko_to_en
    const distractors = shuffled.map(w => w.word)
    choices = [...distractors, word.word].sort(() => Math.random() - 0.5)
    correctIndex = choices.indexOf(word.word)
  }

  // Fill with placeholders if not enough choices
  while (choices.length < 4) {
    choices.push(`보기 ${choices.length + 1}`)
  }

  return {
    wordId: word.id,
    word: word.word,
    translation: word.translation,
    exampleEn: word.exampleEn,
    type,
    choices,
    correctIndex,
  }
}
