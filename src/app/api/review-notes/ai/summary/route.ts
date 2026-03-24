export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { summarizeNote } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json() as any
  const text = typeof content === 'string' ? content : ''
  const summary = await summarizeNote(text)
  return NextResponse.json({ summary })
}
