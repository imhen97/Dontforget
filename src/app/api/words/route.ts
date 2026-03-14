export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateWordData } from '@/lib/ai'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const topic = searchParams.get('topic')
  const mastered = searchParams.get('mastered')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = { userId: authUser.userId }
  if (topic && topic !== 'all') where.topic = topic
  if (mastered !== null) where.mastered = mastered === 'true'
  if (search) {
    where.OR = [
      { word: { contains: search } },
      { translation: { contains: search } },
    ]
  }

  const words = await prisma.word.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(words)
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { word, translation, exampleEn, exampleKo, topic } = await req.json()

  if (!word) {
    return NextResponse.json({ error: '단어를 입력해주세요' }, { status: 400 })
  }

  // Check duplicate
  const existing = await prisma.word.findFirst({
    where: { userId: authUser.userId, word: { equals: word } },
  })
  if (existing) {
    return NextResponse.json({ error: '이미 저장된 단어입니다', word: existing }, { status: 409 })
  }

  let wordData = { translation, exampleEn, exampleKo, topic, difficulty: 3 }

  // If no manual data provided, use AI to generate
  if (!translation || !exampleEn) {
    try {
      const aiData = await generateWordData(word)
      wordData = {
        translation: translation || aiData.translation,
        exampleEn: exampleEn || aiData.exampleEn,
        exampleKo: exampleKo || aiData.exampleKo,
        topic: topic || aiData.topic,
        difficulty: aiData.difficulty,
      }
    } catch (err) {
      console.error('AI generation error:', err)
    }
  }

  const newWord = await prisma.word.create({
    data: {
      userId: authUser.userId,
      word,
      translation: wordData.translation || '',
      exampleEn: wordData.exampleEn || '',
      exampleKo: wordData.exampleKo || '',
      topic: wordData.topic || 'General',
      difficulty: wordData.difficulty || 3,
    },
  })

  // Update vocab level
  await updateVocabLevel(authUser.userId)

  return NextResponse.json(newWord, { status: 201 })
}

async function updateVocabLevel(userId: string) {
  const words = await prisma.word.findMany({
    where: { userId },
    select: { word: true, difficulty: true },
  })

  if (words.length === 0) return

  const avgDifficulty = words.reduce((sum, w) => sum + w.difficulty, 0) / words.length

  const levels = [
    { min: 0, max: 1.5, level: 'Beginner' },
    { min: 1.5, max: 2.5, level: 'Elementary' },
    { min: 2.5, max: 3.5, level: 'Intermediate' },
    { min: 3.5, max: 4.5, level: 'Upper-Intermediate' },
    { min: 4.5, max: 5.5, level: 'Advanced' },
    { min: 5.5, max: 7, level: 'Proficient' },
  ]

  const found = levels.find(l => avgDifficulty >= l.min && avgDifficulty < l.max)
  const level = found?.level || 'Intermediate'

  // Calculate percentile
  const allLevels = await prisma.vocabLevel.findMany({ select: { score: true } })
  const userScore = avgDifficulty
  const belowCount = allLevels.filter(l => l.score < userScore).length
  const percentile = allLevels.length > 1 ? (belowCount / (allLevels.length - 1)) * 100 : 50

  await prisma.vocabLevel.upsert({
    where: { userId },
    create: { userId, level, score: userScore, totalWords: words.length, percentile },
    update: { level, score: userScore, totalWords: words.length, percentile },
  })
}
