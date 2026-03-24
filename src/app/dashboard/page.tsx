'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import KkamnyangiCat from '@/components/KkamnyangiCat'
import { CAT_ITEMS, CatItem } from '@/lib/catItems'
import { THEMES, applyTheme } from '@/components/ThemeSelector'

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

  // 페이지 로드 후 자동 말풍선
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">📚</div>
      </div>
    )
  }

  const todayProgress = user ? Math.min((user.todayWordsCount / user.dailyGoal) * 100, 100) : 0

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col">
      <Navbar />
      <main className="max-w-2xl w-full mx-auto px-3 pt-3 pb-[60px] md:px-4 md:pt-4 md:pb-4 flex flex-col gap-2.5 flex-1 overflow-hidden">

        {/* 좌측 상단 타이틀 */}
        <div style={{ flexShrink: 0 }}>
          <h1 className="font-handwrite font-bold" style={{ fontSize: '1.4rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            🐱 깜빡 노트
          </h1>
        </div>

        {/* ① 통계 칩 3개 */}
        <div className="grid grid-cols-3 gap-2" style={{ flexShrink: 0 }}>
          {[
            { val: stats?.totalWords ?? 0,        label: '📚 모은 단어' },
            { val: `${stats?.accuracy ?? 0}%`,  label: '🧠 암기율' },
            { val: user?.streak ?? 0,            label: '📅 출석일' },
          ].map(({ val, label }) => (
            <div key={label} className="rounded-2xl text-center py-2.5" style={{ background: '#fff', border: '2px solid var(--purple)' }}>
              <div className="text-xl font-extrabold" style={{ color: 'var(--ink)' }}>{val}</div>
              <div className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--ink)', opacity: 0.7 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ③ 오늘 목표 + 진행바 */}
        <div className="card py-2.5" style={{ flexShrink: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>{user?.todayWordsCount || 0}</span>
              <span className="text-sm font-semibold text-gray-400">/ {user?.dailyGoal}단어 목표</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{Math.round(todayProgress)}%</span>
              <button
                onClick={() => setShowGoalEdit(!showGoalEdit)}
                className="text-xs font-bold px-2.5 rounded-full"
                style={{ background: 'var(--purple)', color: 'var(--ink)', minHeight: 28, display: 'inline-flex', alignItems: 'center', border: '1.5px solid var(--purple)' }}
              >
                목표 변경
              </button>
            </div>
          </div>

          {showGoalEdit && (
            <div className="flex gap-2 mb-2">
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                min="1" max="10" className="input-field text-sm w-20" style={{ minHeight: 36, paddingTop: 6, paddingBottom: 6 }} />
              <button onClick={updateGoal} className="btn-primary text-sm px-3" style={{ minHeight: 36, padding: '6px 14px' }}>저장</button>
              <button onClick={() => setShowGoalEdit(false)} className="btn-ghost text-sm" style={{ minHeight: 36, padding: '6px 12px' }}>취소</button>
            </div>
          )}

          <div className="w-full rounded-full h-4 overflow-hidden" style={{ background: '#f0f0f0' }}>
            <div className="h-4 rounded-full transition-all duration-500 relative"
              style={{ width: `${todayProgress}%`, background: 'var(--pink)', minWidth: todayProgress > 0 ? 8 : 0 }}>
              {todayProgress >= 20 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--ink)' }}>
                  {Math.round(todayProgress)}%
                </span>
              )}
            </div>
          </div>
          {todayProgress >= 100 && (
            <p className="text-center text-sm font-bold mt-1.5" style={{ color: 'var(--ink)' }}>🎉 오늘 목표 달성!</p>
          )}
        </div>

        {/* ④ 고양이 카드 — 남은 공간 꽉 채움 */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl"
          style={{ flex: '1 1 0', minHeight: 0, background: 'var(--yellow)', border: '2px solid var(--purple)' }}>
          {/* 우상단 버튼 */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5">
            <button onClick={() => setShowShop(true)} className="text-sm font-bold rounded-full"
              style={{ background: 'var(--purple)', color: 'var(--ink)', minHeight: 28, minWidth: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--purple)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 9 L6 3 L18 3 L20 9 Z" fill="#ff99c8" />
                <line x1="9" y1="3" x2="7.5" y2="9" stroke="white" strokeWidth="1" opacity="0.5" />
                <line x1="12" y1="3" x2="11" y2="9" stroke="white" strokeWidth="1" opacity="0.5" />
                <line x1="15" y1="3" x2="14" y2="9" stroke="white" strokeWidth="1" opacity="0.5" />
                <rect x="4" y="9" width="16" height="12" rx="1.5" fill="#fcf6bd" stroke="#e4c1f9" strokeWidth="1.2" />
                <rect x="9.5" y="13" width="5" height="8" rx="1" fill="#e4c1f9" />
                <rect x="5" y="10.5" width="4" height="3" rx="0.5" fill="#a9def9" />
                <rect x="15" y="10.5" width="4" height="3" rx="0.5" fill="#a9def9" />
                <circle cx="12" cy="6" r="2.2" fill="#1a1a1a" />
                <circle cx="11.2" cy="5.5" r="0.7" fill="white" />
                <circle cx="12.8" cy="5.5" r="0.7" fill="white" />
                <circle cx="11.3" cy="5.6" r="0.4" fill="#1a1a1a" />
                <circle cx="12.9" cy="5.6" r="0.4" fill="#1a1a1a" />
                <polygon points="10.8,4.8 10.2,3.8 11.6,4.6" fill="#1a1a1a" />
                <polygon points="13.2,4.8 13.8,3.8 12.4,4.6" fill="#1a1a1a" />
              </svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="text-sm font-bold rounded-full"
              style={{ background: '#fff', color: 'var(--ink)', minHeight: 28, minWidth: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--purple)' }}>
              ⚙️
            </button>
          </div>
          {/* 좌상단 냥 */}
          <p className="absolute top-3 left-3 text-xs text-gray-400">🐾 {user?.nyang ?? 0}냥</p>
          {/* 말풍선 + 고양이 */}
          <div className="flex flex-col items-center gap-2" style={{ width: '100%' }}>
            <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {catMsgVisible && (
                <div onClick={() => setCatMsgVisible(false)} style={{
                  background: 'rgba(255,255,255,0.95)', border: '1.5px solid var(--pink)',
                  borderRadius: '14px 14px 14px 4px', padding: '7px 14px', fontSize: '12px',
                  fontWeight: 700, color: '#3a3038', maxWidth: 220, textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)', cursor: 'pointer',
                  animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {tutorialIdx >= 0 && <span style={{ fontSize: 10, opacity: 0.6, display: 'block', marginBottom: 2 }}>탭해서 다음 →</span>}
                  {catMsg}
                </div>
              )}
            </div>
            <button onClick={handleCatClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <KkamnyangiCat equippedItems={user?.equippedItems ?? {}} size={110} />
            </button>
          </div>
        </div>

        {/* ⑤ 주요 버튼들 */}
        <div className="flex flex-col gap-2" style={{ flexShrink: 0 }}>
          <Link href="/words?add=1"
            className="btn-primary btn-pink w-full justify-center"
            style={{ fontSize: '1.2rem', padding: '16px 20px', minHeight: 68, borderRadius: 16 }}
          >
            ➕ 단어 추가하기
          </Link>
          <Link href="/quiz"
            className="btn-primary btn-pink w-full justify-center"
            style={{ fontSize: '1.1rem', padding: '15px 20px', minHeight: 64, borderRadius: 16 }}
          >
            ✏️ 오늘 복습 퀴즈
          </Link>
        </div>

        {/* ⑤ 보조 메뉴 2개 */}
        <div className="grid grid-cols-2 gap-2" style={{ flexShrink: 0 }}>
          {[
            { href: '/stats',       title: '📊 내 기록' },
            { href: '/leaderboard', title: '🏆 리더보드' },
          ].map(({ href, title }) => (
            <Link key={href} href={href}
              className="btn-primary justify-center"
              style={{ fontSize: '0.9rem', padding: '10px 12px', minHeight: 48, borderRadius: 16 }}
            >
              {title}
            </Link>
          ))}
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
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--yellow)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-800">🛍️ 깜냥이 옷 가게</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'var(--pink)', color: 'var(--ink)' }}>
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
                        borderColor: equipped ? 'var(--pink)' : '#e5e7eb',
                        background: equipped ? 'var(--yellow)' : 'var(--paper)',
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.description}</div>
                      {owned ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: equipped ? 'var(--pink)' : 'var(--purple)', color: 'var(--ink)' }}
                        >
                          {equipped ? '벗기' : '착용'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={user.nyang < item.price || buying === item.id}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full disabled:opacity-40"
                          style={{ background: 'var(--purple)', color: 'var(--ink)' }}
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
                        borderColor: equipped ? 'var(--pink)' : '#e5e7eb',
                        background: equipped ? 'var(--yellow)' : 'var(--paper)',
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.description}</div>
                      {owned ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: equipped ? 'var(--pink)' : 'var(--purple)', color: 'var(--ink)' }}
                        >
                          {equipped ? '벗기' : '착용'}
                        </button>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={user.nyang < item.price || buying === item.id}
                          className="mt-1 text-xs font-bold px-3 py-1 rounded-full disabled:opacity-40"
                          style={{ background: 'var(--purple)', color: 'var(--ink)' }}
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
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ background: 'var(--yellow)' }}>
              <h2 className="font-bold text-lg" style={{ color: 'var(--ink)' }}>⚙️ 환경설정</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-6">
              {/* 깜빡냥이 표시 */}
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>🐱 깜빡냥이</p>
                <button
                  onClick={toggleMascot}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                  style={{ border: '2px solid #e5e7eb', background: 'var(--paper)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>응원 깜빡냥이 표시</span>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: mascotDisabled ? '#e5e7eb' : 'var(--pink)', border: '2px solid var(--ink)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: mascotDisabled ? 2 : 20, width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '1.5px solid var(--ink)', transition: 'left 0.2s' }} />
                  </div>
                </button>
              </div>

              {/* 테마 선택 */}
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>🎨 UI 테마</p>
                <div className="flex flex-col gap-2">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => selectTheme(t.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{
                        border: `2.5px solid ${currentTheme === t.id ? t.vars['--pink'] : '#e5e7eb'}`,
                        background: currentTheme === t.id ? t.vars['--yellow'] : 'var(--paper)',
                      }}
                    >
                      <div className="flex gap-1.5">
                        {[t.vars['--yellow'], t.vars['--pink'], t.vars['--purple']].map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: t.vars['--ink'] + '33' }} />
                        ))}
                      </div>
                      <span className="text-sm font-bold flex-1 text-left" style={{ color: 'var(--ink)' }}>{t.label}</span>
                      {currentTheme === t.id && (
                        <span className="text-sm font-bold" style={{ color: t.vars['--pink'] }}>✓ 적용 중</span>
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
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#fff0f0', color: '#e53e3e', border: '2px solid #feb2b2' }}
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
