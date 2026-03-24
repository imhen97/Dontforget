export type ItemSlot = 'hat' | 'accessory'

export interface CatItem {
  id: string
  slot: ItemSlot
  name: string
  price: number
  description: string
  emoji: string
}

export const CAT_ITEMS: CatItem[] = [
  // ── 모자 ──
  { id: 'hat_crown',      slot: 'hat', name: '황금 왕관',   price: 80, description: '고귀한 깜냥이',         emoji: '👑' },
  { id: 'hat_witch',      slot: 'hat', name: '마녀 모자',   price: 60, description: '마법 부리는 깜냥이',    emoji: '🎩' },
  { id: 'hat_strawberry', slot: 'hat', name: '딸기 모자',   price: 50, description: '새콤달콤 깜냥이',       emoji: '🍓' },
  { id: 'hat_graduate',   slot: 'hat', name: '학사모',      price: 70, description: '공부왕 깜냥이',         emoji: '🎓' },
  { id: 'hat_santa',      slot: 'hat', name: '산타 모자',   price: 45, description: '선물 주는 깜냥이',      emoji: '🎅' },
  { id: 'hat_party',      slot: 'hat', name: '파티 모자',   price: 40, description: '생일파티 깜냥이',       emoji: '🎉' },
  { id: 'hat_flower',     slot: 'hat', name: '꽃 왕관',     price: 55, description: '봄바람 깜냥이',         emoji: '🌸' },
  { id: 'hat_bunny',      slot: 'hat', name: '토끼 귀',     price: 50, description: '깡충깡충 깜냥이',       emoji: '🐰' },
  { id: 'hat_beret',      slot: 'hat', name: '베레모',      price: 45, description: '예술가 깜냥이',         emoji: '🎨' },
  { id: 'hat_angel',      slot: 'hat', name: '천사 링',     price: 65, description: '착한 척하는 깜냥이',    emoji: '😇' },
  { id: 'hat_devil',      slot: 'hat', name: '악마 뿔',     price: 60, description: '장난꾸러기 깜냥이',     emoji: '😈' },
  { id: 'hat_chef',       slot: 'hat', name: '주방장 모자', price: 55, description: '요리하는 깜냥이',       emoji: '🍳' },
  { id: 'hat_pirate',     slot: 'hat', name: '해적 모자',   price: 70, description: '모험가 깜냥이',         emoji: '☠️'  },
  { id: 'hat_headphones', slot: 'hat', name: '헤드폰',      price: 75, description: '음악 덕후 깜냥이',      emoji: '🎧' },
  { id: 'hat_mushroom',   slot: 'hat', name: '버섯 모자',   price: 50, description: '숲속 요정 깜냥이',      emoji: '🍄' },
  // ── 악세서리 ──
  { id: 'acc_ribbon',     slot: 'accessory', name: '분홍 리본',   price: 30, description: '귀여움 만렙 깜냥이',  emoji: '🎀' },
  { id: 'acc_glasses',    slot: 'accessory', name: '동그란 안경', price: 35, description: '지적인 깜냥이',      emoji: '👓' },
  { id: 'acc_bowtie',     slot: 'accessory', name: '나비넥타이',  price: 40, description: '멋쟁이 깜냥이',      emoji: '🦋' },
  { id: 'acc_necklace',   slot: 'accessory', name: '하트 목걸이', price: 40, description: '사랑스러운 깜냥이',  emoji: '💝' },
  { id: 'acc_star',       slot: 'accessory', name: '별 참',       price: 35, description: '반짝반짝 깜냥이',    emoji: '⭐' },
  { id: 'acc_scarf',      slot: 'accessory', name: '리본 스카프', price: 45, description: '따뜻한 깜냥이',      emoji: '🧣' },
  { id: 'acc_mustache',   slot: 'accessory', name: '콧수염',      price: 25, description: '신사 깜냥이',        emoji: '🎭' },
  { id: 'acc_clover',     slot: 'accessory', name: '클로버',      price: 30, description: '행운의 깜냥이',      emoji: '🍀' },
  { id: 'acc_heart_eyes', slot: 'accessory', name: '하트 안경',   price: 50, description: '사랑에 빠진 깜냥이', emoji: '💕' },
  { id: 'acc_collar',     slot: 'accessory', name: '방울 목걸이', price: 35, description: '딸랑딸랑 깜냥이',    emoji: '🔔' },
  { id: 'acc_pearl',      slot: 'accessory', name: '진주 목걸이', price: 60, description: '우아한 깜냥이',      emoji: '💎' },
  { id: 'acc_sunglasses', slot: 'accessory', name: '선글라스',    price: 40, description: '쿨한 깜냥이',        emoji: '😎' },
  { id: 'acc_mask',       slot: 'accessory', name: '마스크',      price: 20, description: '청결한 깜냥이',      emoji: '😷' },
]

export const ITEM_MAP = new Map<string, CatItem>(CAT_ITEMS.map(i => [i.id, i]))
