import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const note = await prisma.reviewNote.findFirst({ where: { id, userId: authUser.userId } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await req.json()
  const updated = await prisma.reviewNote.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: String(data.title).trim() || note.title }),
      ...(data.content !== undefined && { content: String(data.content) }),
      ...(data.summary !== undefined && { summary: data.summary === null ? null : String(data.summary) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(_req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const note = await prisma.reviewNote.findFirst({ where: { id, userId: authUser.userId } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.reviewNote.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
