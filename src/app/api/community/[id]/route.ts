
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true } },
      comments: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId: authUser.userId } },
    },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...post,
    liked: post.likes.length > 0,
    isMe: post.user.id === authUser.userId,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
