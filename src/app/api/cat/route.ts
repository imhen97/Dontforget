import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, ownedItems] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { nyang: true, equippedItems: true },
    }),
    prisma.userCatItem.findMany({
      where: { userId: authUser.userId },
      select: { itemId: true },
    }),
  ])

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    nyang: user.nyang,
    ownedItemIds: ownedItems.map(i => i.itemId),
    equippedItems: (() => { try { return JSON.parse(user.equippedItems || '{}') } catch { return {} } })() as Record<string, string>,
  })
}
