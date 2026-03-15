import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ITEM_MAP } from '@/lib/catItems'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await req.json()
  const item = ITEM_MAP.get(itemId)
  if (!item) return NextResponse.json({ error: '존재하지 않는 아이템이에요' }, { status: 400 })

  const [user, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: authUser.userId }, select: { nyang: true } }),
    prisma.userCatItem.findUnique({ where: { userId_itemId: { userId: authUser.userId, itemId } } }),
  ])

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing) return NextResponse.json({ error: '이미 보유한 아이템이에요' }, { status: 409 })
  if (user.nyang < item.price) return NextResponse.json({ error: '냥이 부족해요! 😿' }, { status: 400 })

  const afterNyang = user.nyang - item.price
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: authUser.userId },
      data: { nyang: afterNyang },
      select: { nyang: true },
    }),
    prisma.userCatItem.create({ data: { userId: authUser.userId, itemId } }),
  ])

  return NextResponse.json({ success: true, nyang: updatedUser.nyang })
}
