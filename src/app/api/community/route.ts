export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const where = category && category !== 'all' ? { category } : {}

  const posts = await prisma.post.findMany({
    where,
    include: {
      user: { select: { id: true, username: true } },
      _count: { select: { comments: true, likes: true } },
      likes: { where: { userId: authUser.userId } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(
    posts.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content.slice(0, 200),
      category: p.category,
      author: p.user.username,
      authorId: p.user.id,
      commentCount: p._count.comments,
      likeCount: p._count.likes,
      liked: p.likes.length > 0,
      isMe: p.user.id === authUser.userId,
      createdAt: p.createdAt,
    }))
  )
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, category } = await req.json() as any

  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 })
  }

  const post = await prisma.post.create({
    data: {
      userId: authUser.userId,
      title,
      content,
      category: category || 'general',
    },
    include: {
      user: { select: { id: true, username: true } },
      _count: { select: { comments: true, likes: true } },
    },
  })

  return NextResponse.json(post, { status: 201 })
}
