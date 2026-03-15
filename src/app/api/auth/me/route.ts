
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        username: true,
        nicknameSet: true,
        dailyGoal: true,
        streak: true,
        createdAt: true,
        nyang: true,
        equippedItems: true,
        customTopics: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { password: _p, ...userSafe } = user
    const hasPassword = !!_p

    // Count today's words
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayWordsCount = await prisma.word.count({
      where: { userId: authUser.userId, createdAt: { gte: today } },
    })

    let ownedItemIds: string[] = []
    try {
      const ownedItems = await prisma.userCatItem.findMany({
        where: { userId: authUser.userId },
        select: { itemId: true },
      })
      ownedItemIds = ownedItems.map(i => i.itemId)
    } catch {
      // userCatItem table may not exist yet — safe fallback
    }

    let equippedItems: Record<string, string> = {}
    try {
      equippedItems = JSON.parse(user.equippedItems || '{}')
    } catch {
      // malformed JSON fallback
    }

    let customTopics: string[] = []
    try {
      customTopics = JSON.parse(user.customTopics || '[]')
      if (!Array.isArray(customTopics)) customTopics = []
    } catch {
      // ignore
    }

    return NextResponse.json({
      ...userSafe,
      hasPassword,
      todayWordsCount,
      ownedItemIds,
      equippedItems,
      customTopics,
    })
  } catch (err) {
    console.error('[GET /api/auth/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { dailyGoal, customTopics: customTopicsRaw } = body

  const data: { dailyGoal?: number; customTopics?: string } = {}
  if (dailyGoal != null && typeof dailyGoal === 'number' && dailyGoal >= 1 && dailyGoal <= 10) {
    data.dailyGoal = dailyGoal
  }
  if (customTopicsRaw !== undefined) {
    const arr = Array.isArray(customTopicsRaw)
      ? customTopicsRaw.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
      : []
    const unique = Array.from(new Set(arr.map(t => t.trim())))
    data.customTopics = JSON.stringify(unique)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '수정할 필드가 없습니다' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: authUser.userId },
    data,
    select: { id: true, email: true, username: true, dailyGoal: true, streak: true, customTopics: true },
  })

  let customTopics: string[] = []
  try {
    customTopics = JSON.parse(user.customTopics || '[]')
    if (!Array.isArray(customTopics)) customTopics = []
  } catch {
    // ignore
  }

  return NextResponse.json({ ...user, customTopics })
}
