export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json() as any

  const word = await prisma.word.findFirst({ where: { id, userId: authUser.userId } })
  if (!word) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.word.update({
    where: { id },
    data: {
      word: data.word ?? word.word,
      translation: data.translation ?? word.translation,
      exampleEn: data.exampleEn !== undefined ? data.exampleEn : word.exampleEn,
      exampleKo: data.exampleKo !== undefined ? data.exampleKo : word.exampleKo,
      examples: data.examples !== undefined ? data.examples : word.examples,
      topic: data.topic ?? word.topic,
      mastered: data.mastered ?? word.mastered,
      type: data.type ?? word.type,
      ...(data.easeFactor !== undefined && { easeFactor: data.easeFactor }),
      ...(data.interval !== undefined && { interval: data.interval }),
      ...(data.repetitions !== undefined && { repetitions: data.repetitions }),
      ...(data.nextReview !== undefined && { nextReview: new Date(data.nextReview) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const word = await prisma.word.findFirst({ where: { id, userId: authUser.userId } })
  if (!word) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.word.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
