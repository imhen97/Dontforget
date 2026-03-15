import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { generateQuizFromNote } from '@/lib/ai'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  let content: string
  if (body.noteId) {
    const note = await prisma.reviewNote.findFirst({
      where: { id: body.noteId, userId: authUser.userId },
    })
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    content = note.content
  } else {
    content = typeof body.content === 'string' ? body.content : ''
  }

  const questions = await generateQuizFromNote(content)
  return NextResponse.json({ questions })
}
