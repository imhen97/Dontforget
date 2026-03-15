
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateWordData, isKorean, koreanToEnglishWord } from '@/lib/ai'

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
  try {
    const authUser = await getAuthUserFromRequest(req)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: '요청 형식이 올바르지 않아요' }, { status: 400 })
    }
    let { word, translation, exampleEn, exampleKo, topic, examples } = body as {
      word?: string
      translation?: string
      exampleEn?: string
      exampleKo?: string
      topic?: string
      examples?: Array<{ exampleEn?: string; exampleKo?: string }>
    }

    word = word != null ? String(word).trim() : ''
    if (!word) {
      return NextResponse.json({ error: '단어를 입력해주세요' }, { status: 400 })
    }

  // 한국어 입력 시 영단어로 변환
  let koreanInput: string | null = null
  if (isKorean(word.trim())) {
    koreanInput = word.trim()
    try {
      word = await koreanToEnglishWord(koreanInput)
      console.log(`[korean→en] "${koreanInput}" → "${word}"`)
    } catch (err) {
      console.error('[korean→en] error:', err)
    }
  }

  // 사전에 없는 단어면 1순위 추천어로 교체
  let finalWord = word.trim()
  try {
    const [exactRes, sugRes] = await Promise.all([
      fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(finalWord)}&max=1`),
      fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(finalWord)}&max=1`),
    ])
    const exact: { word: string }[] = await exactRes.json()
    const sug: { word: string }[] = await sugRes.json()
    const isExactMatch = exact.length > 0 && exact[0].word.toLowerCase() === finalWord.toLowerCase()
    console.log(`[autocorrect] input="${finalWord}" exact="${exact[0]?.word}" sug="${sug[0]?.word}" isExact=${isExactMatch}`)
    if (!isExactMatch && sug.length > 0) {
      finalWord = sug[0].word
      console.log(`[autocorrect] corrected to "${finalWord}"`)
    }
  } catch (err) {
    console.error('[autocorrect] error:', err)
  }

  // Check duplicate
  const existing = await prisma.word.findFirst({
    where: { userId: authUser.userId, word: { equals: finalWord } },
  })
  if (existing) {
    return NextResponse.json({ error: '이미 저장된 단어입니다', word: existing }, { status: 409 })
  }

    // examples 배열 처리
    const examplesList: { exampleEn?: string; exampleKo?: string }[] =
      Array.isArray(examples) ? examples.filter((e: { exampleEn?: string }) => e?.exampleEn?.trim()) : []

    if (examplesList.length > 0) {
      exampleEn = (exampleEn ?? examplesList[0]?.exampleEn) ?? ''
      exampleKo = (exampleKo ?? examplesList[0]?.exampleKo) ?? ''
    }

    const translationStr = translation != null ? String(translation).trim() : ''
    const exampleEnStr = exampleEn != null ? String(exampleEn).trim() : ''
    const exampleKoStr = exampleKo != null ? String(exampleKo).trim() : ''
    const topicStr = (topic != null ? String(topic) : '') || 'General'

    type WordDataType = 'word' | 'phrase' | 'idiom'
    let wordData: {
      translation: string
      exampleEn: string
      exampleKo: string
      topic: string
      difficulty: number
      type: WordDataType
    } = {
      translation: translationStr,
      exampleEn: exampleEnStr,
      exampleKo: exampleKoStr,
      topic: topicStr,
      difficulty: 3,
      type: 'word',
    }

    // If no manual data provided, use AI to generate
    if (!wordData.translation || !wordData.exampleEn) {
      try {
        const aiData = await generateWordData(finalWord)
        wordData = {
          translation: wordData.translation || (koreanInput ?? aiData.translation) || '',
          exampleEn: wordData.exampleEn || aiData.exampleEn || '',
          exampleKo: wordData.exampleKo || aiData.exampleKo || '',
          topic: wordData.topic !== 'General' ? wordData.topic : (aiData.topic || 'General'),
          difficulty: aiData.difficulty ?? 3,
          type: (aiData.type === 'phrase' || aiData.type === 'idiom' ? aiData.type : 'word') as WordDataType,
        }
      } catch (err) {
        console.error('AI generation error:', err)
        wordData.translation = wordData.translation || ''
        wordData.exampleEn = wordData.exampleEn || `I learned "${finalWord}" today.`
        wordData.exampleKo = wordData.exampleKo || ''
      }
    }

    const examplesJson = examplesList.length > 0 ? JSON.stringify(examplesList) : undefined

    const newWord = await prisma.word.create({
      data: {
        userId: authUser.userId,
        word: finalWord,
        translation: wordData.translation || '',
        exampleEn: wordData.exampleEn || '',
        exampleKo: wordData.exampleKo || null,
        examples: examplesJson ?? undefined,
        topic: wordData.topic || 'General',
        difficulty: wordData.difficulty ?? 3,
        type: wordData.type || 'word',
      },
    })

    // 냥 획득 (+5냥)
    try {
      const u = await prisma.user.findUnique({ where: { id: authUser.userId }, select: { nyang: true } })
      if (u != null) {
        await prisma.user.update({
          where: { id: authUser.userId },
          data: { nyang: (u.nyang ?? 0) + 5 },
        })
      }
    } catch (err) {
      console.error('[POST /api/words] nyang update:', err)
    }

    // Update vocab level
    try {
      await updateVocabLevel(authUser.userId)
    } catch (err) {
      console.error('[POST /api/words] updateVocabLevel:', err)
      // 단어는 이미 저장됐으므로 실패해도 응답은 성공으로
    }

    return NextResponse.json({ ...newWord, nyangEarned: 5 }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/words]', err)
    const message = err instanceof Error ? err.message : '단어 저장 중 오류가 났어요'
    return NextResponse.json({ error: message }, { status: 500 })
  }
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
