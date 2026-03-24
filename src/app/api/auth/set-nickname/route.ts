export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

const ADJECTIVES = [
  '귀여운', '멋진', '용감한', '빠른', '밝은', '달콤한', '상냥한', '쑥스러운',
  '용맹한', '지혜로운', '재빠른', '포근한', '발랄한', '차분한', '열정적인', '수줍은',
]
const NOUNS = [
  '고양이', '냥이', '수첩', '단어', '영어', '공부', '책', '별', '꽃', '바다',
  '산', '구름', '햇살', '달', '커피', '쿠키', '풀', '나무', '고래', '토끼',
]

function randomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const nickname = (searchParams.get('nickname') ?? '').trim()

  if (!nickname) {
    return NextResponse.json({ error: '닉네임을 입력해주세요' }, { status: 400 })
  }

  if (nickname.length < 2 || nickname.length > 20) {
    return NextResponse.json({ error: '닉네임은 2~20자로 해주세요' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { username: nickname },
  })

  return NextResponse.json({ available: !existing })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as any
  const nickname = (body.nickname ?? '').trim()

  if (!nickname) {
    return NextResponse.json({ error: '닉네임을 입력해주세요' }, { status: 400 })
  }

  if (nickname.length < 2 || nickname.length > 20) {
    return NextResponse.json({ error: '닉네임은 2~20자로 해주세요' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { username: nickname },
  })

  if (existing && existing.id !== authUser.userId) {
    return NextResponse.json({ error: '이미 사용 중인 별명이에요' }, { status: 409 })
  }

  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data: { username: nickname, nicknameSet: true },
    select: { id: true, username: true, email: true, dailyGoal: true, streak: true },
  })

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let nickname = randomNickname()
  let attempts = 0
  const maxAttempts = 20

  while (attempts < maxAttempts) {
    const existing = await prisma.user.findUnique({
      where: { username: nickname },
    })
    if (!existing) break
    nickname = randomNickname()
    attempts++
  }

  if (attempts >= maxAttempts) {
    nickname = `냥이친구${Date.now().toString(36).slice(-6)}`
  }

  return NextResponse.json({ nickname })
}
