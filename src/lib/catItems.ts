export type ItemSlot = 'hat' | 'accessory'

export interface CatItem {
  id: string
  slot: ItemSlot
  name: string
  price: number      // 냥 단위
  description: string
  emoji: string      // shop 미리보기용
}

export const CAT_ITEMS: CatItem[] = [
  // ── 모자 ──
  { id: 'hat_crown',      slot: 'hat',       name: '황금 왕관',   price: 80,  description: '고귀한 깜냥이',   emoji: '👑' },
  { id: 'hat_witch',      slot: 'hat',       name: '마녀 모자',   price: 60,  description: '마법을 부리는 깜냥이',          emoji: '🎩' },
  { id: 'hat_strawberry', slot: 'hat',       name: '딸기 모자',   price: 50,  description: '새콤달콤 깜냥이',               emoji: '🍓' },
  { id: 'hat_graduate',   slot: 'hat',       name: '학사모',      price: 70,  description: '공부 잘하는 깜냥이',            emoji: '🎓' },
  { id: 'hat_santa',      slot: 'hat',       name: '산타 모자',   price: 45,  description: '선물 주는 깜냥이',              emoji: '🎅' },
  // ── 악세서리 ──
  { id: 'acc_ribbon',     slot: 'accessory', name: '분홍 리본',   price: 30,  description: '귀여움 만렙 깜냥이',            emoji: '🎀' },
  { id: 'acc_glasses',    slot: 'accessory', name: '동그란 안경', price: 35,  description: '지적인 깜냥이',                 emoji: '👓' },
  { id: 'acc_bowtie',     slot: 'accessory', name: '나비넥타이',  price: 40,  description: '멋쟁이 깜냥이',                 emoji: '🦋' },
]

export const ITEM_MAP = new Map<string, CatItem>(CAT_ITEMS.map(i => [i.id, i]))
