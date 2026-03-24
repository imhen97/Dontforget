'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { THEMES, applyTheme } from '@/components/ThemeSelector'

interface UserMe {
  id: string
  email: string
  username: string
  dailyGoal: number
  streak: number
  nyang: number
  hasPassword?: boolean
}

export default function MorePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  // 별명 변경
  const [nickname, setNickname] = useState('')
  const [nickSaving, setNickSaving] = useState(false)
  const [nickError, setNickError] = useState('')
  const [nickSuccess, setNickSuccess] = useState(false)
  const [showNickSection, setShowNickSection] = useState(false)

  // 비밀번호 변경
  const [showPwSection, setShowPwSection] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  // 알람 설정
  const [alarmTime, setAlarmTime] = useState('09:00')
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [showAlarmSection, setShowAlarmSection] = useState(false)

  // 테마
  const [currentTheme, setCurrentTheme] = useState('cute')
  const [showThemeSection, setShowThemeSection] = useState(false)

  // 깜빡냥이
  const [mascotDisabled, setMascotDisabled] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (!data) { router.replace('/'); return }
        setUser(data)
        setNickname(data.username ?? '')
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false))

    setCurrentTheme(localStorage.getItem('theme') ?? 'cute')
    setMascotDisabled(localStorage.getItem('mascot-disabled') === 'true')
    setAlarmEnabled(localStorage.getItem('alarm-enabled') === 'true')
    setAlarmTime(localStorage.getItem('alarm-time') ?? '09:00')
  }, [router])

  const handleNickSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setNickError('')
    setNickSuccess(false)
    const t = nickname.trim()
    if (!t || t.length < 2 || t.length > 20) { setNickError('2~20자로 입력해주세요'); return }
    if (t === user?.username) return
    const chk = await fetch(`/api/auth/set-nickname?nickname=${encodeURIComponent(t)}`)
    const chkData: any = await chk.json()
    if (!chkData.available) { setNickError('이미 사용 중인 별명이에요'); return }
    setNickSaving(true)
    try {
      const res = await fetch('/api/auth/set-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: t }),
      })
      if (!res.ok) { const d: any = await res.json(); setNickError(d.error || '실패했어요'); return }
      const d: any = await res.json()
      setUser(prev => prev ? { ...prev, username: d.username } : null)
      setNickSuccess(true)
    } finally { setNickSaving(false) }
  }

  const handleRandomNick = async () => {
    const res = await fetch('/api/auth/set-nickname', { method: 'PUT' })
    const d: any = await res.json()
    if (d.nickname) setNickname(d.nickname)
  }

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (newPw.length < 6) { setPwError('새 비밀번호는 6자 이상이에요'); return }
    if (newPw !== confirmPw) { setPwError('비밀번호가 일치하지 않아요'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const d: any = await res.json()
      if (!res.ok) { setPwError(d.error || '변경 실패'); return }
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } finally { setPwSaving(false) }
  }

  const toggleMascot = () => {
    const next = !mascotDisabled
    setMascotDisabled(next)
    localStorage.setItem('mascot-disabled', String(next))
    window.dispatchEvent(new Event('mascot-setting-changed'))
  }

  const saveAlarm = () => {
    localStorage.setItem('alarm-enabled', String(alarmEnabled))
    localStorage.setItem('alarm-time', alarmTime)
    if (alarmEnabled && 'Notification' in window) {
      Notification.requestPermission()
    }
  }

  const selectTheme = (id: string) => {
    setCurrentTheme(id)
    localStorage.setItem('theme', id)
    applyTheme(id)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">⚙️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-5">

        {/* 프로필 헤더 */}
        <div className="card mb-4 flex items-center gap-4" style={{ background: 'var(--yellow)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{ background: '#fff', border: '2px solid var(--pink)' }}>
            🐱
          </div>
          <div>
            <p className="font-extrabold text-lg" style={{ color: 'var(--ink)' }}>{user.username}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink)', opacity: 0.6 }}>
              🐾 {user.nyang}냥 · 📅 {user.streak}일 출석
            </p>
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div className="flex flex-col gap-2">

          {/* ── 별명 변경 ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setShowNickSection(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">✏️</span>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>별명 변경</p>
                  <p className="text-xs text-gray-400">현재: {user.username}</p>
                </div>
              </div>
              <span className="text-gray-400">{showNickSection ? '▲' : '▼'}</span>
            </button>
            {showNickSection && (
              <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--purple)' }}>
                <form onSubmit={handleNickSave} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => { setNickname(e.target.value); setNickError(''); setNickSuccess(false) }}
                      className="input-field flex-1"
                      placeholder="2~20자"
                      minLength={2} maxLength={20}
                    />
                    <button type="button" onClick={handleRandomNick}
                      className="btn-primary" style={{ padding: '8px 12px', minHeight: 40, fontSize: '0.85rem' }}>
                      🎲
                    </button>
                  </div>
                  {nickError && <p className="text-xs text-red-500">😾 {nickError}</p>}
                  {nickSuccess && <p className="text-xs text-green-600">별명이 변경됐어요!</p>}
                  <button type="submit" disabled={nickSaving || nickname.trim() === user.username}
                    className="btn-primary btn-pink w-full" style={{ minHeight: 42 }}>
                    {nickSaving ? '저장 중...' : '별명 변경하기'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── 알람 설정 ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setShowAlarmSection(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>알람 설정</p>
                  <p className="text-xs text-gray-400">{alarmEnabled ? `${alarmTime} 매일 알림` : '알람 꺼짐'}</p>
                </div>
              </div>
              <span className="text-gray-400">{showAlarmSection ? '▲' : '▼'}</span>
            </button>
            {showAlarmSection && (
              <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--purple)' }}>
                <div className="space-y-3">
                  {/* 알람 온오프 토글 */}
                  <button
                    onClick={() => setAlarmEnabled(e => !e)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ border: '2px solid #e5e7eb', background: 'var(--paper)' }}
                  >
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>매일 공부 알림</span>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: alarmEnabled ? 'var(--pink)' : '#e5e7eb', border: '2px solid var(--ink)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: alarmEnabled ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '1.5px solid var(--ink)', transition: 'left 0.2s' }} />
                    </div>
                  </button>
                  {/* 시간 선택 */}
                  {alarmEnabled && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>알림 시간</label>
                      <input
                        type="time"
                        value={alarmTime}
                        onChange={e => setAlarmTime(e.target.value)}
                        className="input-field"
                        style={{ maxWidth: 130 }}
                      />
                    </div>
                  )}
                  <button onClick={saveAlarm} className="btn-primary btn-pink w-full" style={{ minHeight: 42 }}>
                    저장
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    알림 허용 팝업이 뜨면 허용해주세요
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── 테마 변경 ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setShowThemeSection(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎨</span>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>UI 테마</p>
                  <p className="text-xs text-gray-400">{THEMES.find(t => t.id === currentTheme)?.label ?? '귀여운 핑크'}</p>
                </div>
              </div>
              <span className="text-gray-400">{showThemeSection ? '▲' : '▼'}</span>
            </button>
            {showThemeSection && (
              <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--purple)' }}>
                <div className="flex flex-col gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => selectTheme(t.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ border: `2px solid ${currentTheme === t.id ? t.vars['--pink'] : '#e5e7eb'}`, background: currentTheme === t.id ? t.vars['--yellow'] : 'var(--paper)' }}>
                      <div className="flex gap-1.5">
                        {[t.vars['--yellow'], t.vars['--pink'], t.vars['--purple']].map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border-2" style={{ background: c, borderColor: '#e5e7eb' }} />
                        ))}
                      </div>
                      <span className="text-sm font-bold flex-1 text-left" style={{ color: 'var(--ink)' }}>{t.label}</span>
                      {currentTheme === t.id && <span className="text-xs font-bold" style={{ color: t.vars['--pink'] }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 깜빡냥이 ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={toggleMascot}
              className="w-full flex items-center justify-between px-4 py-3.5"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🐱</span>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>깜빡냥이 말풍선</p>
                  <p className="text-xs text-gray-400">{mascotDisabled ? '꺼짐' : '켜짐'}</p>
                </div>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: mascotDisabled ? '#e5e7eb' : 'var(--pink)', border: '2px solid var(--ink)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: mascotDisabled ? 2 : 20, width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '1.5px solid var(--ink)', transition: 'left 0.2s' }} />
              </div>
            </button>
          </div>

          {/* ── 비밀번호 변경 ── */}
          {user.hasPassword && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setShowPwSection(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3.5"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>비밀번호 변경</p>
                </div>
                <span className="text-gray-400">{showPwSection ? '▲' : '▼'}</span>
              </button>
              {showPwSection && (
                <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--purple)' }}>
                  <form onSubmit={handlePwSave} className="space-y-2">
                    <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                      className="input-field" placeholder="현재 비밀번호" required />
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                      className="input-field" placeholder="새 비밀번호 (6자 이상)" minLength={6} required />
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      className="input-field" placeholder="새 비밀번호 확인" required />
                    {pwError && <p className="text-xs text-red-500">😾 {pwError}</p>}
                    {pwSuccess && <p className="text-xs text-green-600">비밀번호가 변경됐어요!</p>}
                    <button type="submit" disabled={pwSaving} className="btn-primary w-full" style={{ minHeight: 42 }}>
                      {pwSaving ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── 바로가기 ── */}
          <div className="card" style={{ padding: '8px 0', overflow: 'hidden' }}>
            {[
              { href: '/stats',       icon: '📊', label: '내 학습 기록' },
              { href: '/leaderboard', icon: '🏆', label: '리더보드' },
              { href: '/community',   icon: '💬', label: '커뮤니티' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 hover:opacity-70 transition-opacity">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{item.label}</span>
                <span className="ml-auto text-gray-300">›</span>
              </Link>
            ))}
          </div>

          {/* ── 로그아웃 ── */}
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl text-sm font-bold mt-1"
            style={{ background: '#fff', color: '#e53e3e', border: '2px solid #feb2b2' }}
          >
            🚪 로그아웃
          </button>

        </div>
      </main>
    </div>
  )
}
