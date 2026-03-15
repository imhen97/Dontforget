import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { suggestNoteTitle } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  const text = typeof content === 'string' ? content : ''
  const title = await suggestNoteTitle(text)
  return NextResponse.json({ title })
}
