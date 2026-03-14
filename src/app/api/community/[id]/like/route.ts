import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: authUser.userId } },
  })

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  } else {
    await prisma.postLike.create({ data: { postId, userId: authUser.userId } })
    return NextResponse.json({ liked: true })
  }
}
