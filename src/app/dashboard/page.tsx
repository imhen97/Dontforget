'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import KkamnyangiCat from '@/components/KkamnyangiCat'
import { CAT_ITEMS, CatItem } from '@/lib/catItems'

interface UserData {
  username: string
  dailyGoal: number
  streak: number
  todayWordsCount: number
  nyang: number
  ownedItemIds: string[]
  equippedItems: Record<string, string>
}

interface Stats {
  totalWords: number
  dueToday: number
  accuracy: number
  weeklyActivity: Array<{ date: string; label: string; added: number; quizzed: number }>
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true)
  const [goalInput, setGoalInput] = useState('')
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : r.json().catch(() => ({}))),
      fetch('/api/stats').then(r => r.ok ? r.json() : r.json().catch(() => ({}))),
    ]).then(([userData, statsData]) => {
      setUser({
        ...userData,
        nyang: userData.nyang ?? 0,
        ownedItemIds: userData.ownedItemIds ?? [],
        equippedItems: userData.equippedItems ?? {},
      })
      setStats(statsData)
      setGoalInput(String(userData.dailyGoal || 5))
      setLoading(false)
    }).catch(err => {
      console.error('Dashboard fetch error:', err)
      setLoading(false)
    })
  }, [])

  const updateGoal = async () => {
    const goal = parseInt(goalInput)
    if (goal < 1 || goal > 10) return
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoal: goal }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(prev => prev ? { ...prev, dailyGoal: data.dailyGoal } : null)
      setShowGoalEdit(false)
    }
  }

  const buyItem = async (item: CatItem) => {
    if (!user) return
    setBuying(item.id)
    const res = await fetch('/api/cat/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(prev => prev ? {
        ...prev,
        nyang: data.nyang,
        ownedItemIds: [...prev.ownedItemIds, item.id],
      } : null)
    }
    setBuying(null)
  }

  const toggleEquip = async (item: CatItem) => {
    if (!user) return
    const isEquipped = user.equippedItems[item.slot] === item.id
    const res = await fetch('/api/cat/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: isEquipped ? null : item.id, slot: item.slot }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(prev => prev ? { ...prev, equippedItems: data.equippedItems } : null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">📚</div>
      </div>
    )
  }

  const todayProgress = user ? Math.min((user.todayWordsCount / user.dailyGoal) * 100, 100) : 0

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Greeting + Cat */}
        <div className="card mb-4 flex items-center gap-4" style={{ background: '#fcf6bd' }}>
          <div className="flex-shrink-0">
            <KkamnyangiCat equippedItems={user?.equippedItems ?? {}} size={100} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800">
              {user?.username} 친구 안녕하다냥~ 🐾
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">오늘도 같이 공부하자냥~</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold" style={{ color: '#1a1a1a' }}>
                🐾 {user?.nyang ?? 0}냥
              </span>
              <button
                onClick={() => setShowShop(true)}
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#e4c1f9', color: '#1a1a1a' }}
              >
                꾸미기 상점
              </button>
            </div>
          </div>
        </div>

        {/* Streak + Goal row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{user?.streak || 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">연속 출석</div>
          </div>

          <div className="card text-center">
            <div className="text-3xl mb-1">🎯</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                {user?.todayWordsCount || 0}
              </span>
              <span className="text-sm" style={{ color: '#888' }}>/ {user?.dailyGoal}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">오늘 목표</div>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">📅 오늘 진행</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{Math.round(todayProgress)}%</span>
              <button
                onClick={() => setShowGoalEdit(!showGoalEdit)}
                className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#a9def9', color: '#1a1a1a' }}
              >
                목표 변경
              </button>
            </div>
          </div>

          {showGoalEdit && (
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                min="1"
                max="10"
                className="input-field text-sm py-1.5 w-20"
              />
              <button onClick={updateGoal} className="btn-primary text-sm py-1.5 px-3">
                저장
              </button>
              <button onClick={() => setShowGoalEdit(false)} className="btn-ghost text-sm py-1.5">
                취소
              </button>
            </div>
          )}

          <div className="w-full rounded-full h-3" style={{ background: '#e4c1f9' }}>
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${todayProgress}%`, background: '#ff99c8' }}
            />
          </div>
          {todayProgress >= 100 && (
            <p className="text-center text-sm font-semibold mt-2" style={{ color: '#1a1a1a' }}>
              🎉 목표 달성!! 잘했어요!
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card text-center" style={{ background: '#e4c1f9' }}>
            <div className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{stats?.totalWords || 0}</div>
            <div className="text-xs mt-0.5" style={{ color: '#1a1a1a' }}>모은 단어</div>
          </div>
          <div className="card text-center" style={{ background: '#ff99c8' }}>
            <div className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{stats?.dueToday || 0}</div>
            <div className="text-xs mt-0.5" style={{ color: '#1a1a1a' }}>복습할 것</div>
          </div>
          <div className="card text-center" style={{ background: '#d0f4de' }}>
            <div className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{stats?.accuracy || 0}%</div>
            <div className="text-xs mt-0.5" style={{ color: '#1a1a1a' }}>정답률</div>
          </div>
        </div>

        {/* Weekly activity */}
        {stats?.weeklyActivity && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 이번 주 활동</h3>
            <div className="flex items-end justify-between gap-1 h-16">
              {stats.weeklyActivity.map(day => {
                const maxVal = Math.max(...stats.weeklyActivity.map(d => d.added + d.quizzed), 1)
                const height = ((day.added + day.quizzed) / maxVal) * 100
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{ height: `${height}%`, minHeight: day.added + day.quizzed > 0 ? '4px' : '0', background: '#ff99c8' }}
                    />
                    <span className="text-[10px] text-gray-400">{day.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/words?add=1" className="card flex items-center gap-3 hover:bg-[#fcf6bd] transition-colors cursor-pointer">
            <span className="text-2xl">➕</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">단어 추가</div>
              <div className="text-xs text-gray-500">새 단어를 추가해보세요</div>
            </div>
          </Link>

          <Link href="/quiz" className="card flex items-center gap-3 hover:bg-[#fcf6bd] transition-colors cursor-pointer">
            <span className="text-2xl">✏️</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">퀴즈 풀기</div>
              <div className="text-xs text-gray-500">
                {stats?.dueToday ? `${stats.dueToday}개 복습 예정` : '랜덤 퀴즈'}
              </div>
            </div>
          </Link>

          <Link href="/stats" className="card flex items-center gap-3 hover:bg-[#fcf6bd] transition-colors cursor-pointer">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">내 기록</div>
              <div className="text-xs text-gray-500">공부 통계 보기</div>
            </div>
          </Link>

          <Link href="/leaderboard" className="card flex items-center gap-3 hover:bg-[#fcf6bd] transition-colors cursor-pointer">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">리더보드</div>
              <div className="text-xs text-gray-500">순위 확인</div>
            </div>
          </Link>
        </div>
      </main>

      {/* ── SHOP MODAL ── */}
      {showShop && user && Array.isArray(user.ownedItemIds) && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowShop(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: '#fcf6bd' }}>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-800">🏪 깜냥이 꾸미기 상점</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: '#ff99c8', color: '#1a1a1a' }}>
                    매일 업데이트 중
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">내 냥: <strong>{user.nyang}냥</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <KkamnyangiCat equippedItems={user.equippedItems} size={60} />
                <button onClick={() => setShowShop(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
              </div>
            </div>

            {/* Items grid */}
            <div className="overflow-y-auto p-4 flex-1">
              {/* Hats */}
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">모자</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CAT_ITEMS.filter(i => i.slot === 'hat').map(item => {
                  const owned = user.ownedItemIds.includes(item.id)
                  const equipped = user.equippedItems[item.slot] === item.id
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-3 border-2 flex flex-col items-center text-center gap-1"
                      style={{
                        borderColor: equipped ? '#ff99c8' : '#e5e7eb',
                        background: equipped ? '#fff0f7' : 'white',
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.description}</div>
                      {owned ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: equipped ? '#ff99c8' : '#d0f4de', color: '#1a1a1a' }}
                        >
                          {equipped ? '벗기' : '착용'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={user.nyang < item.price || buying === item.id}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full disabled:opacity-40"
                          style={{ background: '#a9def9', color: '#1a1a1a' }}
                        >
                          {buying === item.id ? '구매 중...' : `${item.price}냥`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Accessories */}
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">악세서리</h3>
              <div className="grid grid-cols-2 gap-2">
                {CAT_ITEMS.filter(i => i.slot === 'accessory').map(item => {
                  const owned = user.ownedItemIds.includes(item.id)
                  const equipped = user.equippedItems[item.slot] === item.id
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl p-3 border-2 flex flex-col items-center text-center gap-1"
                      style={{
                        borderColor: equipped ? '#ff99c8' : '#e5e7eb',
                        background: equipped ? '#fff0f7' : 'white',
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.description}</div>
                      {owned ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: equipped ? '#ff99c8' : '#d0f4de', color: '#1a1a1a' }}
                        >
                          {equipped ? '벗기' : '착용'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={user.nyang < item.price || buying === item.id}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full disabled:opacity-40"
                          style={{ background: '#a9def9', color: '#1a1a1a' }}
                        >
                          {buying === item.id ? '구매 중...' : `${item.price}냥`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
