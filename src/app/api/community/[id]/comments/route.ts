import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params
  const { content } = await req.json()

  if (!content) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: { postId, userId: authUser.userId, content },
    include: { user: { select: { id: true, username: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: commentId } = await params
  const comment = await prisma.comment.findFirst({ where: { id: commentId, userId: authUser.userId } })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.comment.delete({ where: { id: commentId } })
  return NextResponse.json({ success: true })
}
