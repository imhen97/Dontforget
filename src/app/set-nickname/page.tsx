'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

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
      .then((data: any) => {
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
      const data: any = await res.json()
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
    const checkData: any = await checkRes.json()
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
      const data: any = await res.json()
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f7ff]">
      <div className="w-full max-w-sm animate-fade-in">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            별명을 정해주세요
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
            리더보드와 커뮤니티에서 사용할<br />나만의 별명이에요
          </p>
        </div>

        {/* 카드 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">별명</label>
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
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRandom}
                  disabled={randomLoading || loading}
                  className="btn-secondary whitespace-nowrap px-3"
                >
                  {randomLoading ? '...' : '🎲'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">🎲 버튼을 누르면 랜덤 별명을 추천해 드려요</p>
            </div>

            {error && (
              <div className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || checking || !nickname.trim()}
              className="btn-primary w-full"
            >
              {loading || checking ? '확인 중...' : '시작하기 🚀'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          별명은 나중에 설정에서 변경할 수 있어요
        </p>
      </div>
    </div>
  )
}
