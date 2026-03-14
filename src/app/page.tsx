'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', username: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { email: form.email, username: form.username, password: form.password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">📚</div>
          <h1 className="text-3xl font-bold text-pink-600">Don&apos;t Forget</h1>
          <p className="text-gray-500 mt-2 text-sm">나만의 스마트 영단어장 ✨</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-8">
          {/* Tab Toggle */}
          <div className="flex bg-pink-50 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                isLogin ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => { setIsLogin(false); setError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                !isLogin ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="example@email.com"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">사용자명</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="input-field"
                  placeholder="닉네임을 입력해주세요"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="6자 이상"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-2">
              {loading ? '처리 중...' : isLogin ? '로그인 🚀' : '시작하기 🎉'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            {isLogin ? '아직 계정이 없나요? ' : '이미 계정이 있나요? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-pink-500 font-medium hover:underline"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '🤖', text: 'AI 예문 생성' },
            { icon: '🔄', text: 'Anki 복습' },
            { icon: '🏆', text: '순위 경쟁' },
          ].map(f => (
            <div key={f.text} className="bg-white/70 rounded-2xl p-3 text-center border border-pink-100">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs text-gray-600 font-medium">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
