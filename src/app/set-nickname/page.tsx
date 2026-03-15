'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetNicknamePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [randomLoading, setRandomLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) {
          router.replace('/')
          return
        }
        if (data.nicknameSet) {
          router.replace('/dashboard')
        }
      })
      .catch(() => router.replace('/'))
  }, [router])

  const handleRandom = async () => {
    setRandomLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/set-nickname', { method: 'PUT' })
      const data = await res.json()
      if (data.nickname) setNickname(data.nickname)
    } finally {
      setRandomLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = nickname.trim()
    if (!trimmed) {
      setError('별명을 입력해주세요')
      return
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError('별명은 2~20자로 해주세요')
      return
    }

    setChecking(true)
    const checkRes = await fetch(`/api/auth/set-nickname?nickname=${encodeURIComponent(trimmed)}`)
    const checkData = await checkRes.json()
    setChecking(false)

    if (!checkData.available) {
      setError('이미 사용 중인 별명이에요')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/set-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '설정에 실패했어요')
        return
      }
      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#fcf6bd' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-xl font-bold text-gray-800">별명을 정해주세요!</h1>
          <p className="text-gray-500 text-sm mt-1">
            다른 유저와 겹치지 않는 별명이에요. 메인에서 &quot;별명 친구 안녕하다냥~&quot; 이렇게 불러줄게요.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border-2 border-[#ff99c8] shadow-[4px_4px_0_0_#ff99c8]"
          style={{ background: '#fff' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">별명</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={e => { setNickname(e.target.value); setError('') }}
                  className="input-field flex-1"
                  placeholder="2~20자"
                  minLength={2}
                  maxLength={20}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleRandom}
                  disabled={randomLoading || loading}
                  className="btn-secondary whitespace-nowrap"
                >
                  {randomLoading ? '...' : '🎲 랜덤'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 font-medium">😾 {error}</div>
            )}

            <button
              type="submit"
              disabled={loading || checking || !nickname.trim()}
              className="btn-primary w-full"
            >
              {loading || checking ? '확인 중...' : '시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
