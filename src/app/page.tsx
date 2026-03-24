'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isLogin) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다')
        setLoading(false)
        return
      }
    }

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
    } else if (!isLogin) {
      router.push('/set-nickname')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider)
    signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f7ff]">
      <div className="w-full max-w-sm animate-fade-in">

        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            깜빡 노트
          </h1>
          <p className="text-gray-500 text-sm mt-1">잊기 전에 저장하고 매일 복습해요</p>
        </div>

        {/* 카드 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl p-6">

          {/* 탭 */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
            {(['로그인', '회원가입'] as const).map((label, i) => {
              const active = (i === 0) === isLogin
              return (
                <button
                  key={label}
                  onClick={() => { setIsLogin(i === 0); setError('') }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white shadow-sm text-gray-800'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-2.5 mb-5">
            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: '#FEE500', color: '#3C1E1E' }}
            >
              {socialLoading === 'kakao' ? '연결 중...' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M9 0C4.029 0 0 3.136 0 7.001c0 2.493 1.536 4.677 3.857 5.916l-.982 3.663a.25.25 0 0 0 .376.274L7.54 14.53A10.6 10.6 0 0 0 9 14.002c4.971 0 9-3.135 9-7.001S13.971 0 9 0" fill="#3C1E1E"/>
                  </svg>
                  카카오로 계속하기
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialLogin('google')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-semibold text-sm border border-gray-200 bg-white text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
            >
              {socialLoading === 'google' ? '연결 중...' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Google로 계속하기
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialLogin('apple')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-semibold text-sm bg-gray-900 text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-60"
            >
              {socialLoading === 'apple' ? '연결 중...' : (
                <>
                  <svg width="14" height="16" viewBox="0 0 16 18" fill="white">
                    <path d="M13.173 9.545c-.022-2.38 1.944-3.528 2.032-3.584-1.107-1.62-2.829-1.842-3.44-1.867-1.464-.149-2.862.864-3.604.864-.742 0-1.887-.845-3.1-.822C3.4 4.16 1.83 5.01.96 6.395c-1.784 3.087-.457 7.653 1.28 10.156.845 1.224 1.853 2.596 3.177 2.547 1.277-.051 1.757-.821 3.3-.821 1.543 0 1.978.821 3.322.797 1.373-.022 2.244-1.247 3.079-2.478.975-1.42 1.374-2.8 1.396-2.87-.03-.013-2.674-1.028-2.699-4.072l.358.891z"/>
                    <path d="M10.898 2.184C11.59 1.337 12.06.18 11.93-.99c-.984.06-2.17.655-2.872 1.484-.632.746-1.186 1.94-1.037 3.083 1.096.085 2.213-.558 2.877-1.393z"/>
                  </svg>
                  Apple로 계속하기
                </>
              )}
            </button>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는 이메일로 {isLogin ? '로그인' : '회원가입'}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field w-full"
              placeholder="이메일"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field w-full"
              placeholder="비밀번호 (6자 이상)"
              required
            />

            {error && (
              <div className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-1">
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            {isLogin ? '아직 계정이 없으세요? ' : '이미 계정이 있으세요? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-purple-600 font-semibold hover:text-purple-700"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>

        {/* 특징 */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: '🤖', text: 'AI 예문 생성' },
            { icon: '🔄', text: 'Anki 복습' },
            { icon: '🏆', text: '순위 경쟁' },
          ].map(f => (
            <div key={f.text} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-xs text-gray-500 font-medium">{f.text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
