import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest) {
  const authUser = await getAuthUserFromRequest(_req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notes = await prisma.reviewNote.findMany({
    where: { userId: authUser.userId },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const title = (body.title as string)?.trim() || '제목 없음'
  const content = (body.content as string)?.trim() || ''

  const note = await prisma.reviewNote.create({
    data: {
      userId: authUser.userId,
      title,
      content,
    },
  })

  return NextResponse.json(note)
}
