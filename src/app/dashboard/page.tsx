'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import KkamnyangiCat from '@/components/KkamnyangiCat'
import { CAT_ITEMS, CatItem } from '@/lib/catItems'
import { THEMES, applyTheme } from '@/components/ThemeSelector'
import { BookOpen, Brain, Target, Flame, Plus } from 'lucide-react'

const CAT_MESSAGES = [
  '옷 사줘냥 🥶',
  '퀴즈 안 풀면 삐진다냥 😾',
  '냥이 배고프다냥 🍜',
  '같이 공부하자냥 🐾',
  '오늘 목표 달성 해라냥 💪',
  '왕관 사줄 냥 없냐냥 👑',
  '냥이 지켜보고 있다냥 👀',
  '단어 10개 = 냥 1개냥!',
  '내일 두 배냥... 지금 해라냥 😤',
  '꾸준히 해라냥 ✨',
]

const TUTORIAL_STEPS = [
  '안녕! 나는 깜빡냥이야 🐾 앱 사용법 알려줄게냥!',
  '➕ 단어 추가하기 로 영단어를 저장해봐냥!',
  '✏️ 오늘 복습 퀴즈 로 기억을 강화해냥!',
  '퀴즈 맞히면 냥 획득! 나 꾸며줄 수 있다냥 🎀',
  '자, 시작해봐냥! 파이팅이다냥 💪',
]

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
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('cute')
  const [mascotDisabled, setMascotDisabled] = useState(false)
  const [catMsg, setCatMsg] = useState('')
  const [catMsgVisible, setCatMsgVisible] = useState(false)
  const catMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tutorialIdx, setTutorialIdx] = useState(-1)

  useEffect(() => {
    setCurrentTheme(localStorage.getItem('theme') ?? 'cute')
    setMascotDisabled(localStorage.getItem('mascot-disabled') === 'true')
    if (localStorage.getItem('tutorial-pending') === 'true') {
      localStorage.removeItem('tutorial-pending')
      setTutorialIdx(0)
      setCatMsg(TUTORIAL_STEPS[0])
      setCatMsgVisible(true)
    }
  }, [])

  const selectTheme = (id: string) => {
    setCurrentTheme(id)
    localStorage.setItem('theme', id)
    applyTheme(id)
  }

  const toggleMascot = () => {
    const next = !mascotDisabled
    setMascotDisabled(next)
    localStorage.setItem('mascot-disabled', String(next))
    window.dispatchEvent(new Event('mascot-setting-changed'))
  }

  const showCatMsg = (msg?: string) => {
    const m = msg ?? CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)]
    setCatMsg(m)
    setCatMsgVisible(true)
    if (catMsgTimer.current) clearTimeout(catMsgTimer.current)
    catMsgTimer.current = setTimeout(() => setCatMsgVisible(false), 5000)
  }

  useEffect(() => {
    const t = setTimeout(() => showCatMsg(), 1200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCatClick = () => {
    if (tutorialIdx >= 0) {
      const next = tutorialIdx + 1
      if (next < TUTORIAL_STEPS.length) {
        setTutorialIdx(next)
        setCatMsg(TUTORIAL_STEPS[next])
        setCatMsgVisible(true)
      } else {
        setTutorialIdx(-1)
        setCatMsgVisible(false)
      }
      return
    }
    if (catMsgVisible) { setCatMsgVisible(false); return }
    showCatMsg()
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : r.json().catch(() => ({}))),
      fetch('/api/stats').then(r => r.ok ? r.json() : r.json().catch(() => ({}))),
    ]).then(([userData, statsData]) => {
      const u = userData as any;
      const s = statsData as any;
      setUser({
        ...u,
        nyang: u.nyang ?? 0,
        ownedItemIds: u.ownedItemIds ?? [],
        equippedItems: u.equippedItems ?? {},
      })
      setStats(s)
      setGoalInput(String(u.dailyGoal || 5))
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
      const data: any = await res.json()
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
      const data: any = await res.json()
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
      const data: any = await res.json()
      setUser(prev => prev ? { ...prev, equippedItems: data.equippedItems } : null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
        <div className="text-4xl animate-bounce-light">📚</div>
      </div>
    )
  }

  const todayProgress = user ? Math.min((user.todayWordsCount / user.dailyGoal) * 100, 100) : 0

  const statCards = [
    { icon: BookOpen, label: '모은 단어', value: String(stats?.totalWords ?? 0), color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
    { icon: Brain,    label: '암기율',    value: `${stats?.accuracy ?? 0}%`,      color: 'from-pink-500 to-rose-600',   bgColor: 'bg-pink-50' },
    { icon: Target,   label: '오늘 목표', value: `${Math.round(todayProgress)}%`, color: 'from-blue-500 to-cyan-600',   bgColor: 'bg-blue-50' },
    { icon: Flame,    label: '출석일',    value: String(user?.streak ?? 0),       color: 'from-orange-500 to-amber-600',bgColor: 'bg-orange-50' },
  ]

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-[#f8f7ff]">
      <Navbar />
      <main className="max-w-2xl w-full mx-auto px-4 pt-4 pb-[72px] md:px-4 md:pt-5 md:pb-4 flex flex-col gap-4 flex-1 overflow-y-auto">

        {/* 타이틀 */}
        <div className="flex items-center justify-between" style={{ flexShrink: 0 }}>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              안녕하세요! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">오늘도 열심히 학습해볼까요?</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              🐾 {user?.nyang ?? 0}냥
            </span>
          </div>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-3" style={{ flexShrink: 0 }}>
          {statCards.map(({ icon: Icon, label, value, color, bgColor }) => (
            <div
              key={label}
              className={`${bgColor} rounded-3xl p-4 border border-white/60 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">{label}</div>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
            </div>
          ))}
        </div>

        {/* 오늘 목표 + 진행바 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md p-4" style={{ flexShrink: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-gray-800">{user?.todayWordsCount || 0}</span>
              <span className="text-sm text-gray-400 font-medium">/ {user?.dailyGoal}단어 목표</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-purple-600">{Math.round(todayProgress)}%</span>
              <button
                onClick={() => setShowGoalEdit(!showGoalEdit)}
                className="text-xs font-semibold px-3 py-1 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                목표 변경
              </button>
            </div>
          </div>

          {showGoalEdit && (
            <div className="flex gap-2 mb-3">
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                min="1" max="10" className="input-field text-sm w-20" style={{ minHeight: 36, paddingTop: 6, paddingBottom: 6 }} />
              <button onClick={updateGoal} className="btn-primary text-sm px-3" style={{ minHeight: 36, padding: '6px 14px' }}>저장</button>
              <button onClick={() => setShowGoalEdit(false)} className="btn-ghost text-sm" style={{ minHeight: 36, padding: '6px 12px' }}>취소</button>
            </div>
          )}

          <div className="w-full rounded-full h-3 overflow-hidden bg-gray-100">
            <div
              className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${todayProgress}%`, minWidth: todayProgress > 0 ? 8 : 0 }}
            />
          </div>
          {todayProgress >= 100 && (
            <p className="text-center text-sm font-bold mt-2 text-purple-600">🎉 오늘 목표 달성!</p>
          )}
        </div>

        {/* 고양이 카드 */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-gray-200/50 bg-gradient-to-b from-purple-50 to-pink-50 shadow-md"
          style={{ flex: '1 1 0', minHeight: 120 }}>
          {/* 우상단 버튼 */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={() => setShowShop(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/80 border border-gray-200/50 shadow-sm hover:shadow-md transition-all text-sm"
            >
              🛍️
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/80 border border-gray-200/50 shadow-sm hover:shadow-md transition-all text-sm"
            >
              ⚙️
            </button>
          </div>

          {/* 말풍선 + 고양이 */}
          <div className="flex flex-col items-center gap-2" style={{ width: '100%' }}>
            <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {catMsgVisible && (
                <div
                  onClick={() => setCatMsgVisible(false)}
                  className="bg-white/95 rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700 border border-purple-100 shadow-md cursor-pointer max-w-[220px] text-center"
                  style={{ animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                >
                  {tutorialIdx >= 0 && <span className="block text-[10px] text-gray-400 mb-1">탭해서 다음 →</span>}
                  {catMsg}
                </div>
              )}
            </div>
            <button onClick={handleCatClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <KkamnyangiCat equippedItems={user?.equippedItems ?? {}} size={110} />
            </button>
          </div>
        </div>

        {/* 주요 액션 버튼 */}
        <div className="flex flex-col gap-3" style={{ flexShrink: 0 }}>
          <Link
            href="/words?add=1"
            className="w-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white font-semibold py-5 px-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold">단어 추가하기</div>
                <div className="text-xs opacity-80">새로운 단어를 저장해요</div>
              </div>
            </div>
            <span className="text-xl opacity-70 group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          <Link
            href="/quiz"
            className="w-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white font-semibold py-5 px-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold">오늘 복습 퀴즈</div>
                <div className="text-xs opacity-80">
                  {stats?.dueToday ? `${stats.dueToday}개의 단어가 기다려요` : '복습으로 기억을 강화해요'}
                </div>
              </div>
            </div>
            <span className="text-xl opacity-70 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* 보조 메뉴 */}
        <div className="grid grid-cols-2 gap-3" style={{ flexShrink: 0 }}>
          <Link
            href="/stats"
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200 py-3 px-4 flex items-center gap-2 text-gray-700 hover:text-purple-600 font-semibold text-sm"
          >
            <span className="text-lg">📊</span> 내 기록
          </Link>
          <Link
            href="/leaderboard"
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200 py-3 px-4 flex items-center gap-2 text-gray-700 hover:text-purple-600 font-semibold text-sm"
          >
            <span className="text-lg">🏆</span> 리더보드
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
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white text-lg">🛍️ 깜냥이 옷 가게</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white animate-pulse">
                    매일 업데이트 중
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">내 냥: <strong>{user.nyang}냥</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <KkamnyangiCat equippedItems={user.equippedItems} size={60} />
                <button onClick={() => setShowShop(false)} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
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
                      className="rounded-2xl p-3 border flex flex-col items-center text-center gap-1 transition-all"
                      style={{
                        borderColor: equipped ? '#a78bfa' : '#e5e7eb',
                        background: equipped ? '#faf5ff' : '#fff',
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.description}</div>
                      {owned ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className="mt-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                          style={{
                            background: equipped
                              ? 'linear-gradient(to right, #ec4899, #e11d48)'
                              : 'linear-gradient(to right, #9333ea, #7c3aed)',
                            color: '#fff',
                          }}
                        >
                          {equipped ? '벗기' : '착용'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={user.nyang < item.price || buying === item.id}
                          className="mt-1 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-40 transition-all"
                          style={{ background: 'linear-gradient(to right, #9333ea, #7c3aed)', color: '#fff' }}
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
                      className="rounded-2xl p-3 border flex flex-col items-center text-center gap-1 transition-all"
                      style={{
                        borderColor: equipped ? '#a78bfa' : '#e5e7eb',
                        background: equipped ? '#faf5ff' : '#fff',
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.description}</div>
                      {owned ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className="mt-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                          style={{
                            background: equipped
                              ? 'linear-gradient(to right, #ec4899, #e11d48)'
                              : 'linear-gradient(to right, #9333ea, #7c3aed)',
                            color: '#fff',
                          }}
                        >
                          {equipped ? '벗기' : '착용'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={user.nyang < item.price || buying === item.id}
                          className="mt-1 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-40 transition-all"
                          style={{ background: 'linear-gradient(to right, #9333ea, #7c3aed)', color: '#fff' }}
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

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl">
              <h2 className="font-bold text-lg text-white">⚙️ 환경설정</h2>
              <button onClick={() => setShowSettings(false)} className="text-white/80 hover:text-white text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-6">
              {/* 깜빡냥이 표시 */}
              <div>
                <p className="text-sm font-bold mb-3 text-gray-700">🐱 깜빡냥이</p>
                <button
                  onClick={toggleMascot}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all border border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  <span className="text-sm font-semibold text-gray-700">응원 깜빡냥이 표시</span>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: mascotDisabled ? '#e5e7eb' : 'linear-gradient(to right, #9333ea, #ec4899)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, left: mascotDisabled ? 3 : 21,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                    }} />
                  </div>
                </button>
              </div>

              {/* 테마 선택 */}
              <div>
                <p className="text-sm font-bold mb-3 text-gray-700">🎨 UI 테마</p>
                <div className="flex flex-col gap-2">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTheme(t.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border"
                      style={{
                        borderColor: currentTheme === t.id ? '#a78bfa' : '#e5e7eb',
                        background: currentTheme === t.id ? '#faf5ff' : '#fff',
                      }}
                    >
                      <div className="flex gap-1.5">
                        {[t.vars['--yellow'], t.vars['--pink'], t.vars['--purple']].map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                        ))}
                      </div>
                      <span className="text-sm font-bold flex-1 text-left text-gray-700">{t.label}</span>
                      {currentTheme === t.id && (
                        <span className="text-xs font-bold text-purple-600">✓ 적용 중</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 로그아웃 */}
              <div className="border-t pt-4">
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/'
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
