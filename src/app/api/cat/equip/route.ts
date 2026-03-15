import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ITEM_MAP } from '@/lib/catItems'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId, slot } = await req.json() as { itemId: string | null; slot: string }

  if (!['hat', 'accessory'].includes(slot)) {
    return NextResponse.json({ error: '잘못된 슬롯이에요' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { equippedItems: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const equipped: Record<string, string> = (() => { try { return JSON.parse(user.equippedItems || '{}') } catch { return {} } })()

  if (itemId === null) {
    // 해제
    delete equipped[slot]
  } else {
    const item = ITEM_MAP.get(itemId)
    if (!item || item.slot !== slot) {
      return NextResponse.json({ error: '슬롯이 맞지 않아요' }, { status: 400 })
    }
    // 소유 확인
    const owns = await prisma.userCatItem.findUnique({
      where: { userId_itemId: { userId: authUser.userId, itemId } },
    })
    if (!owns) return NextResponse.json({ error: '보유하지 않은 아이템이에요' }, { status: 403 })
    equipped[slot] = itemId
  }

  await prisma.user.update({
    where: { id: authUser.userId },
    data: { equippedItems: JSON.stringify(equipped) },
  })

  return NextResponse.json({ equippedItems: equipped })
}
