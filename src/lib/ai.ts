import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GeneratedWordData {
  translation: string
  exampleEn: string
  exampleKo: string
  topic: string
  difficulty: number
}

export async function generateWordData(word: string): Promise<GeneratedWordData> {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an English vocabulary tutor. For the word or phrase "${word}", provide:
1. Korean translation (한국어 번역)
2. A natural English example sentence using the word
3. Korean translation of the example sentence
4. Topic category (one of: Business, Academic, Daily Life, Travel, Technology, Nature, Emotions, Food, Health, General)
5. Difficulty level (1=A1 beginner, 2=A2 elementary, 3=B1 intermediate, 4=B2 upper-intermediate, 5=C1 advanced, 6=C2 proficient)

Respond in this exact JSON format:
{
  "translation": "한국어 번역",
  "exampleEn": "English example sentence",
  "exampleKo": "한국어 예문 번역",
  "topic": "Category",
  "difficulty": 3
}

Only respond with the JSON object, no other text.`,
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')?.text || '{}'

  try {
    // Extract JSON from response
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
    }
  }
}

export async function assessVocabLevel(
  words: { word: string; difficulty: number }[]
): Promise<{ level: string; score: number }> {
  if (words.length === 0) return { level: 'Beginner', score: 1 }

  const avgDifficulty = words.reduce((sum, w) => sum + w.difficulty, 0) / words.length

  const levels = [
    { min: 0, max: 1.5, level: 'Beginner', score: 1 },
    { min: 1.5, max: 2.5, level: 'Elementary', score: 2 },
    { min: 2.5, max: 3.5, level: 'Intermediate', score: 3 },
    { min: 3.5, max: 4.5, level: 'Upper-Intermediate', score: 4 },
    { min: 4.5, max: 5.5, level: 'Advanced', score: 5 },
    { min: 5.5, max: 7, level: 'Proficient', score: 6 },
  ]

  const found = levels.find(l => avgDifficulty >= l.min && avgDifficulty < l.max)
  return found ? { level: found.level, score: found.score } : { level: 'Intermediate', score: 3 }
}

export async function generateQuizDistractors(
  correctWord: string,
  correctTranslation: string,
  otherWords: { word: string; translation: string }[]
): Promise<string[]> {
  // Use existing words as distractors first
  const distractors = otherWords
    .filter(w => w.word !== correctWord)
    .map(w => w.translation)
    .slice(0, 3)

  if (distractors.length >= 3) return distractors.slice(0, 3)

  // If not enough words, generate AI distractors
  const needed = 3 - distractors.length
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Generate ${needed} wrong Korean translations for the English word "${correctWord}" (correct answer: "${correctTranslation}"). These should be plausible but incorrect. Return only a JSON array of strings like ["오답1", "오답2"]. No other text.`,
        },
      ],
    })

    const text = response.content.find(b => b.type === 'text')?.text || '[]'
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
