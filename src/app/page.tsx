'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const CatSvg = () => (
  <svg width="90" height="90" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="8,28 18,8 26,26" fill="#1a1a1a" />
    <polygon points="38,26 46,8 56,28" fill="#1a1a1a" />
    <polygon points="11,26 18,12 24,25" fill="#ff99c8" />
    <polygon points="40,25 46,12 53,26" fill="#ff99c8" />
    <ellipse cx="32" cy="36" rx="22" ry="20" fill="#1a1a1a" />
    <ellipse cx="24" cy="32" rx="5" ry="5.5" fill="#fff" />
    <ellipse cx="40" cy="32" rx="5" ry="5.5" fill="#fff" />
    <ellipse cx="24.5" cy="32.5" rx="3" ry="3.5" fill="#222" />
    <ellipse cx="40.5" cy="32.5" rx="3" ry="3.5" fill="#222" />
    <circle cx="26" cy="31" r="1.2" fill="#fff" />
    <circle cx="42" cy="31" r="1.2" fill="#fff" />
    <ellipse cx="32" cy="40" rx="2.5" ry="1.8" fill="#ff9eb5" />
    <path d="M29.5 42 Q32 45 34.5 42" stroke="#666" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <line x1="10" y1="39" x2="27" y2="41" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
    <line x1="10" y1="42" x2="27" y2="42.5" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
    <line x1="37" y1="41" x2="54" y2="39" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
    <line x1="37" y1="42.5" x2="54" y2="42" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

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
      const data = await res.json()
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#fcf6bd' }}
    >
      <div className="w-full max-w-md animate-fade-in">

        {/* ── 수첩 커버 느낌 로고 ── */}
        <div className="text-center mb-6">
          {/* 스프링 장식 */}
          <div className="flex justify-center gap-3 mb-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: '#fff',
                border: '2px solid #ff99c8',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
              }} />
            ))}
          </div>
          <div className="flex justify-center mb-3">
            <CatSvg />
          </div>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '0.03em',
          }}>
            깜냥 수첩
          </h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: '#7a6e78',
            fontSize: '1rem',
            marginTop: '4px',
          }}>
            또 까먹었냥 ?? 나랑 같이 외워보자냥! 😼
          </p>
        </div>

        {/* ── 수첩 노트 카드 ── */}
        <div
          style={{
            background: '#fff',
            borderRadius: '4px 12px 12px 4px',
            border: '2px solid #a9def9',
            borderLeft: '5px solid #ff99c8',
            boxShadow: '4px 4px 0px #ff99c8',
            padding: '28px 28px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 줄 무늬 배경 */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(#a9def9 1px, transparent 1px)',
            backgroundSize: '100% 28px',
            opacity: 0.15,
          }} />

          {/* 탭 토글 */}
          <div className="flex gap-1 mb-6" style={{ position: 'relative', zIndex: 1 }}>
            {(['로그인', '회원가입'] as const).map((label, i) => {
              const active = (i === 0) === isLogin
              return (
                <button
                  key={label}
                  onClick={() => { setIsLogin(i === 0); setError('') }}
                  style={{
                    flex: 1,
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '1rem',
                    fontWeight: active ? 700 : 400,
                    padding: '6px 0 8px',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#3a3038' : '#b8adb6',
                    border: 'none',
                    borderBottom: active ? '3px solid #ff99c8' : '3px solid #fcf6bd',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-2.5 mb-5" style={{ position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={!!socialLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '10px 16px',
                fontFamily: "'Nunito', sans-serif", fontSize: '1rem', fontWeight: 700,
                background: '#FEE500', color: '#3C1E1E',
                border: '2px solid #3C1E1E', borderRadius: '6px',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
                cursor: 'pointer', opacity: socialLoading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {socialLoading === 'kakao' ? '연결 중...' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 0C4.029 0 0 3.136 0 7.001c0 2.493 1.536 4.677 3.857 5.916l-.982 3.663a.25.25 0 0 0 .376.274L7.54 14.53A10.6 10.6 0 0 0 9 14.002c4.971 0 9-3.135 9-7.001S13.971 0 9 0" fill="#3C1E1E"/>
                  </svg>
                  카카오로 계속하기
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialLogin('google')}
              disabled={!!socialLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '10px 16px',
                fontFamily: "'Nunito', sans-serif", fontSize: '1rem', fontWeight: 700,
                background: '#fff', color: '#3a3038',
                border: '2px solid #a9def9', borderRadius: '6px',
                boxShadow: '3px 3px 0px #a9def9',
                cursor: 'pointer', opacity: socialLoading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {socialLoading === 'google' ? '연결 중...' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18">
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
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '10px 16px',
                fontFamily: "'Nunito', sans-serif", fontSize: '1rem', fontWeight: 700,
                background: '#1a1a1a', color: '#fff',
                border: '2px solid #1a1a1a', borderRadius: '6px',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.25)',
                cursor: 'pointer', opacity: socialLoading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {socialLoading === 'apple' ? '연결 중...' : (
                <>
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="white">
                    <path d="M13.173 9.545c-.022-2.38 1.944-3.528 2.032-3.584-1.107-1.62-2.829-1.842-3.44-1.867-1.464-.149-2.862.864-3.604.864-.742 0-1.887-.845-3.1-.822C3.4 4.16 1.83 5.01.96 6.395c-1.784 3.087-.457 7.653 1.28 10.156.845 1.224 1.853 2.596 3.177 2.547 1.277-.051 1.757-.821 3.3-.821 1.543 0 1.978.821 3.322.797 1.373-.022 2.244-1.247 3.079-2.478.975-1.42 1.374-2.8 1.396-2.87-.03-.013-2.674-1.028-2.699-4.072l.358.891z"/>
                    <path d="M10.898 2.184C11.59 1.337 12.06.18 11.93-.99c-.984.06-2.17.655-2.872 1.484-.632.746-1.186 1.94-1.037 3.083 1.096.085 2.213-.558 2.877-1.393z"/>
                  </svg>
                  Apple로 계속하기
                </>
              )}
            </button>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-5" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, height: 1, borderBottom: '1.5px dashed #a9def9' }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", color: '#888', fontSize: '0.9rem' }}>
              또는 이메일로 {isLogin ? '로그인' : '회원가입'}
            </span>
            <div style={{ flex: 1, height: 1, borderBottom: '1.5px dashed #a9def9' }} />
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleEmailSubmit} className="space-y-4" style={{ position: 'relative', zIndex: 1 }}>
            <div>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#7a6e78', display: 'block', marginBottom: 4 }}>
                이메일
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#7a6e78', display: 'block', marginBottom: 4 }}>
                비밀번호
              </label>
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
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                background: '#fcf6bd', border: '2px solid #ff99c8',
                borderRadius: '6px', padding: '10px 14px',
                color: '#1a1a1a', fontSize: '0.95rem',
              }}>
                😾 {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-2">
              {loading ? '처리 중...' : isLogin ? '수첩 열기 📖' : '수첩 만들기 ✏️'}
            </button>
          </form>

          <p style={{ fontFamily: "'Nunito', sans-serif", textAlign: 'center', fontSize: '0.9rem', color: '#b8adb6', marginTop: 16 }}>
            {isLogin ? '아직 수첩이 없으세요? ' : '이미 계정이 있으세요? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{ color: '#ff99c8', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Gaegu', sans-serif" }}
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>

        {/* 특징 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { icon: '🤖', text: 'AI 예문 생성' },
            { icon: '🔄', text: 'Anki 복습' },
            { icon: '🏆', text: '순위 경쟁' },
          ].map(f => (
            <div key={f.text} style={{
              background: '#fff', borderRadius: '4px 8px 8px 4px',
              border: '2px solid #a9def9', borderLeft: '3px solid #ff99c8',
              padding: '10px 8px', textAlign: 'center',
              boxShadow: '2px 2px 0px #a9def9',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{f.icon}</div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#7a6e78' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
