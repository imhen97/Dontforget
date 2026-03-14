export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json()

  const word = await prisma.word.findFirst({ where: { id, userId: authUser.userId } })
  if (!word) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.word.update({
    where: { id },
    data: {
      word: data.word ?? word.word,
      translation: data.translation ?? word.translation,
      exampleEn: data.exampleEn ?? word.exampleEn,
      exampleKo: data.exampleKo ?? word.exampleKo,
      topic: data.topic ?? word.topic,
      mastered: data.mastered ?? word.mastered,
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
