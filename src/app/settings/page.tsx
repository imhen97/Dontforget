'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface UserMe {
  id: string
  email: string
  username: string
  dailyGoal: number
  streak: number
  hasPassword?: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  const [nickname, setNickname] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const [nicknameRandomLoading, setNicknameRandomLoading] = useState(false)
  const [nicknameError, setNicknameError] = useState('')

  const [dailyGoal, setDailyGoal] = useState(5)
  const [goalSaving, setGoalSaving] = useState(false)

  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) {
          router.replace('/')
          return
        }
        setUser(data)
        setNickname(data.username ?? '')
        setDailyGoal(data.dailyGoal ?? 5)
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false))
  }, [router])

  const handleNicknameRandom = async () => {
    setNicknameRandomLoading(true)
    setNicknameError('')
    try {
      const res = await fetch('/api/auth/set-nickname', { method: 'PUT' })
      const data = await res.json()
      if (data.nickname) setNickname(data.nickname)
    } finally {
      setNicknameRandomLoading(false)
    }
  }

  const handleNicknameSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setNicknameError('')
    const trimmed = nickname.trim()
    if (!trimmed) {
      setNicknameError('별명을 입력해주세요')
      return
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNicknameError('별명은 2~20자로 해주세요')
      return
    }
    if (trimmed === user?.username) return

    const checkRes = await fetch(`/api/auth/set-nickname?nickname=${encodeURIComponent(trimmed)}`)
    const checkData = await checkRes.json()
    if (!checkData.available) {
      setNicknameError('이미 사용 중인 별명이에요')
      return
    }

    setNicknameSaving(true)
    try {
      const res = await fetch('/api/auth/set-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        setNicknameError(data.error || '변경에 실패했어요')
        return
      }
      const data = await res.json()
      setUser(prev => prev ? { ...prev, username: data.username } : null)
    } finally {
      setNicknameSaving(false)
    }
  }

  const handleGoalSave = async () => {
    const num = Math.max(1, Math.min(10, Number(dailyGoal)))
    setDailyGoal(num)
    setGoalSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyGoal: num }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(prev => prev ? { ...prev, dailyGoal: data.dailyGoal } : null)
      }
    } finally {
      setGoalSaving(false)
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } finally {
      setLogoutLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">⚙️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-6">
        <h1 className="page-title">⚙️ 설정</h1>
        <p className="text-gray-500 text-sm mb-6">프로필과 학습 목표를 관리해요.</p>

        {/* 프로필: 별명 */}
        <section className="card mb-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">프로필</h2>
          <p className="text-xs text-gray-500 mb-2">현재 별명: <strong>{user.username}</strong></p>
          <form onSubmit={handleNicknameSave} className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setNicknameError('') }}
              className="input-field flex-1 min-w-0"
              placeholder="2~20자"
              minLength={2}
              maxLength={20}
              disabled={nicknameSaving}
            />
            <button
              type="button"
              onClick={handleNicknameRandom}
              disabled={nicknameRandomLoading || nicknameSaving}
              className="btn-secondary whitespace-nowrap"
            >
              {nicknameRandomLoading ? '...' : '🎲 랜덤'}
            </button>
            <button
              type="submit"
              disabled={nicknameSaving || nickname.trim() === user.username}
              className="btn-primary"
            >
              {nicknameSaving ? '저장 중...' : '별명 변경'}
            </button>
          </form>
          {nicknameError && <p className="text-sm text-red-600 mt-2">😾 {nicknameError}</p>}
        </section>

        {/* 학습: 일일 목표 */}
        <section className="card mb-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">학습</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-600">일일 목표 (단어 개수)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={dailyGoal}
              onChange={e => setDailyGoal(Number(e.target.value) || 1)}
              className="input-field w-20 py-1.5 text-center"
            />
            <span className="text-sm text-gray-500">개</span>
            <button
              type="button"
              onClick={handleGoalSave}
              disabled={goalSaving}
              className="btn-primary"
            >
              {goalSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </section>

        {/* 보안: 비밀번호 변경 - hasPassword 있을 때만 표시 */}
        {user.hasPassword && (
          <section className="card mb-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">보안</h2>
            <PasswordChangeForm />
          </section>
        )}

        {/* 계정: 로그아웃 */}
        <section className="card">
          <h2 className="text-sm font-bold text-gray-700 mb-3">계정</h2>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="btn-ghost text-gray-600 hover:text-red-600"
          >
            {logoutLoading ? '로그아웃 중...' : '로그아웃'}
          </button>
        </section>
      </main>
    </div>
  )
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (newPassword.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 해요')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않아요')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '비밀번호 변경에 실패했어요')
        return
      }
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">현재 비밀번호</label>
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="input-field py-2 text-sm"
          placeholder="현재 비밀번호"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">새 비밀번호</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="input-field py-2 text-sm"
          placeholder="6자 이상"
          minLength={6}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">새 비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="input-field py-2 text-sm"
          placeholder="다시 입력"
          required
          disabled={loading}
        />
      </div>
      {error && <p className="text-sm text-red-600">😾 {error}</p>}
      {success && <p className="text-sm text-green-600">비밀번호가 변경되었어요.</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  )
}
