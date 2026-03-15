import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export function isKorean(text: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text)
}

export async function koreanToEnglishWord(korean: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 64,
    messages: [{
      role: 'user',
      content: `"${korean}"의 가장 대표적인 영단어 또는 영어 표현 하나만 알려줘. 단어나 숙어만, 다른 설명 없이.`,
    }],
  })
  return response.choices[0]?.message?.content?.trim().replace(/['"]/g, '') ?? korean
}

export interface GeneratedWordData {
  translation: string
  exampleEn: string
  exampleKo: string
  topic: string
  difficulty: number
  type: 'word' | 'phrase' | 'idiom'
}

export async function generateWordData(word: string): Promise<GeneratedWordData> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an English vocabulary tutor. For the word or phrase "${word}", provide:
1. Korean translation (한국어 번역)
2. A natural English example sentence using the word
3. Korean translation of the example sentence
4. Topic category (one of: Business, Academic, Daily Life, Travel, Technology, Nature, Emotions, Food, Health, General)
5. Difficulty level (1=하 easy, 2=중 intermediate, 3=상 hard, 4=최상 very hard)
6. Type: classify as "word" (single word), "phrase" (multi-word expression or collocation), or "idiom" (idiomatic expression with non-literal meaning)

Respond in this exact JSON format:
{
  "translation": "한국어 번역",
  "exampleEn": "English example sentence",
  "exampleKo": "한국어 예문 번역",
  "topic": "Category",
  "difficulty": 3,
  "type": "word"
}

Only respond with the JSON object, no other text.`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content || '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0]) as GeneratedWordData
  } catch {
    return {
      translation: '번역을 불러올 수 없습니다',
      exampleEn: `I learned the word "${word}" today.`,
      exampleKo: `나는 오늘 "${word}"라는 단어를 배웠다.`,
      topic: 'General',
      difficulty: 3,
      type: 'word' as const,
    }
  }
}

export async function assessVocabLevel(
  words: { word: string; difficulty: number }[]
): Promise<{ level: string; score: number }> {
  if (words.length === 0) return { level: '하', score: 1 }

  const avgDifficulty = words.reduce((sum, w) => sum + w.difficulty, 0) / words.length

  const levels = [
    { min: 0,   max: 1.5, level: '하',   score: 1 },
    { min: 1.5, max: 2.5, level: '중',   score: 2 },
    { min: 2.5, max: 3.5, level: '상',   score: 3 },
    { min: 3.5, max: 5,   level: '최상', score: 4 },
  ]

  const found = levels.find(l => avgDifficulty >= l.min && avgDifficulty < l.max)
  return found ? { level: found.level, score: found.score } : { level: '중', score: 2 }
}

export async function generateQuizDistractors(
  correctWord: string,
  correctTranslation: string,
  otherWords: { word: string; translation: string }[]
): Promise<string[]> {
  const distractors = otherWords
    .filter(w => w.word !== correctWord)
    .map(w => w.translation)
    .slice(0, 3)

  if (distractors.length >= 3) return distractors.slice(0, 3)

  const needed = 3 - distractors.length
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Generate ${needed} wrong Korean translations for the English word "${correctWord}" (correct answer: "${correctTranslation}"). These should be plausible but incorrect. Return only a JSON array of strings like ["오답1", "오답2"]. No other text.`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const extras = JSON.parse(jsonMatch[0]) as string[]
      return [...distractors, ...extras].slice(0, 3)
    }
  } catch {
    // fallback
  }

  return [...distractors, '모르겠음', '정답 없음'].slice(0, 3)
}

// ── 복습장 메모용 AI ──

export async function suggestNoteTitle(content: string): Promise<string> {
  const slice = content.slice(0, 800)
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 64,
    messages: [
      {
        role: 'user',
        content: `다음 메모 내용을 한 줄로 요약한 짧은 제목 하나만 추천해줘. 15자 이내로. 다른 설명 없이 제목만 출력.\n\n${slice}`,
      },
    ],
  })
  const title = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') ?? '제목 없음'
  return title.slice(0, 100)
}

export async function summarizeNote(content: string): Promise<string> {
  const slice = content.slice(0, 3000)
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `다음 메모를 2~5문장으로 요약해줘. 핵심만 간결하게. 다른 설명 없이 요약문만 출력.\n\n${slice}`,
      },
    ],
  })
  return response.choices[0]?.message?.content?.trim() ?? ''
}

export interface ReviewQuizQuestion {
  question: string
  choices: string[]
  correctIndex: number
}

export async function generateQuizFromNote(content: string): Promise<ReviewQuizQuestion[]> {
  const slice = content.slice(0, 3000)
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음 메모 내용을 바탕으로 복습용 객관식 퀴즈 3~5문항을 만들어줘.
각 문항은 question, choices(4개 배열), correctIndex(0~3) 형식으로.
JSON 배열만 출력. 예: [{"question":"...", "choices":["a","b","c","d"], "correctIndex":0}, ...]
다른 텍스트 없이 JSON만.\n\n${slice}`,
      },
    ],
  })
  const text = response.choices[0]?.message?.content || '[]'
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const arr = JSON.parse(jsonMatch[0]) as Array<{ question: string; choices: string[]; correctIndex: number }>
    return arr
      .filter((q) => q.question && Array.isArray(q.choices) && q.choices.length >= 2 && Number.isInteger(q.correctIndex))
      .slice(0, 5)
      .map((q) => ({
        question: String(q.question),
        choices: q.choices.slice(0, 4).map(String),
        correctIndex: Math.max(0, Math.min(3, q.correctIndex)),
      }))
  } catch {
    return []
  }
}
