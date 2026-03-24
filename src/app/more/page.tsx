'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { THEMES, applyTheme } from '@/components/ThemeSelector'
import { User, Bell, Palette, Lock, BarChart2, Trophy, MessageCircle, ChevronDown, ChevronUp, LogOut } from 'lucide-react'

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

  const [nickname, setNickname] = useState('')
  const [nickSaving, setNickSaving] = useState(false)
  const [nickError, setNickError] = useState('')
  const [nickSuccess, setNickSuccess] = useState(false)
  const [showNickSection, setShowNickSection] = useState(false)

  const [showPwSection, setShowPwSection] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const [alarmTime, setAlarmTime] = useState('09:00')
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [showAlarmSection, setShowAlarmSection] = useState(false)

  const [currentTheme, setCurrentTheme] = useState('cute')
  const [showThemeSection, setShowThemeSection] = useState(false)

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

  const saveAlarm = () => {
    localStorage.setItem('alarm-enabled', String(alarmEnabled))
    localStorage.setItem('alarm-time', alarmTime)
    if (alarmEnabled && 'Notification' in window) Notification.requestPermission()
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
        <div className="text-4xl animate-bounce-light">⚙️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6 bg-[#f8f7ff]">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-3">

        {/* 프로필 헤더 */}
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-3xl p-5 shadow-lg text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-inner">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">{user.username}</p>
            <p className="text-xs text-white/70 truncate">{user.email}</p>
            <p className="text-xs text-white/80 mt-0.5">🐾 {user.nyang}냥 · 📅 {user.streak}일 출석</p>
          </div>
        </div>

        {/* 설정 섹션 */}
        <div className="space-y-2">

          {/* ── 별명 변경 ── */}
          <AccordionItem
            icon={<User className="w-4 h-4 text-purple-600" />}
            label="별명 변경"
            sub={`현재: ${user.username}`}
            open={showNickSection}
            onToggle={() => setShowNickSection(s => !s)}
          >
            <form onSubmit={handleNickSave} className="space-y-2.5">
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
                  className="px-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 font-semibold text-sm hover:bg-purple-100 transition-colors">
                  🎲
                </button>
              </div>
              {nickError && <p className="text-xs text-red-500 font-medium">{nickError}</p>}
              {nickSuccess && <p className="text-xs text-green-600 font-medium">별명이 변경됐어요!</p>}
              <button type="submit" disabled={nickSaving || nickname.trim() === user.username}
                className="btn-primary w-full">
                {nickSaving ? '저장 중...' : '별명 변경하기'}
              </button>
            </form>
          </AccordionItem>

          {/* ── 알람 설정 ── */}
          <AccordionItem
            icon={<Bell className="w-4 h-4 text-purple-600" />}
            label="알람 설정"
            sub={alarmEnabled ? `${alarmTime} 매일 알림` : '알람 꺼짐'}
            open={showAlarmSection}
            onToggle={() => setShowAlarmSection(s => !s)}
          >
            <div className="space-y-3">
              <button
                onClick={() => setAlarmEnabled(e => !e)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700">매일 공부 알림</span>
                <Toggle on={alarmEnabled} />
              </button>
              {alarmEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700 shrink-0">알림 시간</label>
                  <input
                    type="time"
                    value={alarmTime}
                    onChange={e => setAlarmTime(e.target.value)}
                    className="input-field flex-1"
                  />
                </div>
              )}
              <button onClick={saveAlarm} className="btn-primary w-full">저장</button>
              <p className="text-xs text-gray-400 text-center">알림 허용 팝업이 뜨면 허용해주세요</p>
            </div>
          </AccordionItem>

          {/* ── UI 테마 ── */}
          <AccordionItem
            icon={<Palette className="w-4 h-4 text-purple-600" />}
            label="UI 테마"
            sub={THEMES.find(t => t.id === currentTheme)?.label ?? '귀여운 핑크'}
            open={showThemeSection}
            onToggle={() => setShowThemeSection(s => !s)}
          >
            <div className="flex flex-col gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => selectTheme(t.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
                  style={{
                    borderColor: currentTheme === t.id ? '#a78bfa' : '#e5e7eb',
                    background: currentTheme === t.id ? '#faf5ff' : '#fff',
                  }}
                >
                  <div className="flex gap-1.5">
                    {[t.vars['--yellow'], t.vars['--pink'], t.vars['--purple']].map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold flex-1 text-left text-gray-700">{t.label}</span>
                  {currentTheme === t.id && <span className="text-xs font-bold text-purple-600">✓ 적용 중</span>}
                </button>
              ))}
            </div>
          </AccordionItem>

          {/* ── 비밀번호 변경 ── */}
          {user.hasPassword && (
            <AccordionItem
              icon={<Lock className="w-4 h-4 text-purple-600" />}
              label="비밀번호 변경"
              open={showPwSection}
              onToggle={() => setShowPwSection(s => !s)}
            >
              <form onSubmit={handlePwSave} className="space-y-2.5">
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="input-field" placeholder="현재 비밀번호" required />
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  className="input-field" placeholder="새 비밀번호 (6자 이상)" minLength={6} required />
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="input-field" placeholder="새 비밀번호 확인" required />
                {pwError && <p className="text-xs text-red-500 font-medium">{pwError}</p>}
                {pwSuccess && <p className="text-xs text-green-600 font-medium">비밀번호가 변경됐어요!</p>}
                <button type="submit" disabled={pwSaving} className="btn-primary w-full">
                  {pwSaving ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </AccordionItem>
          )}
        </div>

        {/* 바로가기 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md overflow-hidden">
          {[
            { href: '/stats',       Icon: BarChart2,      label: '내 학습 기록' },
            { href: '/leaderboard', Icon: Trophy,          label: '리더보드' },
            { href: '/community',   Icon: MessageCircle,  label: '커뮤니티' },
          ].map(({ href, Icon, label }, i, arr) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-5 py-4 hover:bg-purple-50 transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-semibold text-sm text-gray-700">{label}</span>
              <span className="ml-auto text-gray-300 text-lg">›</span>
            </Link>
          ))}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-3xl text-sm font-bold transition-all bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>

      </main>
    </div>
  )
}

function AccordionItem({
  icon, label, sub, open, onToggle, children,
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-purple-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-gray-800">{label}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? 'linear-gradient(to right, #9333ea, #ec4899)' : '#e5e7eb',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
      }} />
    </div>
  )
}
