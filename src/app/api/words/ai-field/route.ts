export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { generateWordData } from '@/lib/ai'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { word, field, count } = await req.json() as any
  if (!word || !field) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  try {
    if (field === 'koToEn') {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: `"${word}"의 가장 대표적인 영단어 또는 영어 표현 하나만 알려줘. 단어나 숙어만, 다른 설명 없이.`,
        }],
      })
      const englishWord = response.choices[0]?.message?.content?.trim().replace(/['".,]/g, '') ?? word
      return NextResponse.json({ value: englishWord })
    }

    if (field === 'translateExample') {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 128,
        messages: [{ role: 'user', content: `Translate this English sentence to Korean. Return only the Korean translation, nothing else: "${word}"` }],
      })
      const value = response.choices[0]?.message?.content?.trim() ?? ''
      return NextResponse.json({ value })
    }

    if (field === 'examples') {
      const n = Math.min(Math.max(count ?? 2, 1), 5)
      const levels = Array.from({ length: n }, (_, i) => {
        const labels = ['very simple (A1)', 'elementary (A2)', 'intermediate (B1)', 'upper-intermediate (B2)', 'advanced (C1-C2)']
        return `Level ${i + 1}: ${labels[i] ?? 'advanced'}`
      }).join('\n')
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 768,
        messages: [{
          role: 'user',
          content: `For the English word or phrase "${word}", generate exactly ${n} example sentences and their Korean translations by difficulty:\n${levels}\n\nReturn ONLY a JSON array: [{"exampleEn":"...","exampleKo":"..."}]`,
        }],
      })
      const text = response.choices[0]?.message?.content ?? '[]'
      const match = text.match(/\[[\s\S]*\]/)
      const value = match ? JSON.parse(match[0]) : []
      return NextResponse.json({ value })
    }

    if (field === 'translation') {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: `"${word}"의 한국어 뜻을 알려줘. 의미가 실질적으로 다른 경우에만 최대 3개까지, 비슷하면 1개만. 간결하게 핵심 의미만. JSON 배열로만 응답해: ["뜻1", "뜻2"]`,
        }],
      })
      const text = response.choices[0]?.message?.content?.trim() ?? '[]'
      try {
        const match = text.match(/\[[\s\S]*\]/)
        const meanings: string[] = match ? JSON.parse(match[0]) : [text]
        // value는 "/" 구분 문자열, meanings 배열도 함께 반환
        const value = meanings.slice(0, 3).join(' / ')
        return NextResponse.json({ value, meanings: meanings.slice(0, 3) })
      } catch {
        return NextResponse.json({ value: text, meanings: [text] })
      }
    }

    const data = await generateWordData(word)
    const value = field === 'topic' ? data.topic : data.exampleEn
    return NextResponse.json({ value })
  } catch {
    return NextResponse.json({ error: 'AI 생성 실패' }, { status: 500 })
  }
}
