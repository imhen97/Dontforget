export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? ''
  if (!query || query.trim().length < 1) return NextResponse.json([])

  const isKorean = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(query)

  if (isKorean) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: `"${query}"의 뜻과 관련된 영단어 또는 영어 표현을 5개 알려줘. 단어/숙어만, 짧게, JSON 배열로. 예: ["word1","phrase1","word2"]`,
        }],
      })
      const text = response.choices[0]?.message?.content ?? '[]'
      const match = text.match(/\[[\s\S]*\]/)
      const suggestions: string[] = match ? JSON.parse(match[0]) : []
      return NextResponse.json(suggestions.slice(0, 6))
    } catch {
      return NextResponse.json([])
    }
  } else {
    // 영어 입력은 Datamuse 사용
    try {
      const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=6`)
      const data: { word: string }[] = await res.json()
      return NextResponse.json(data.map(d => d.word))
    } catch {
      return NextResponse.json([])
    }
  }
}
