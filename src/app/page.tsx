'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const DapdapiSvg = () => (
  <svg width="90" height="90" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hair spikes */}
    <polygon points="14,24 18,10 25,25" fill="#1a2a1e"/>
    <polygon points="24,19 28,5 33,19" fill="#1a2a1e"/>
    <polygon points="32,19 37,5 41,19" fill="#1a2a1e"/>
    <polygon points="40,25 47,10 51,24" fill="#1a2a1e"/>
    {/* Head */}
    <circle cx="32" cy="33" r="21" fill="#9CFFD9"/>
    {/* Eyebrows */}
    <line x1="16" y1="25" x2="26" y2="28" stroke="#1a2a1e" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="38" y1="28" x2="48" y2="25" stroke="#1a2a1e" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Eyes */}
    <circle cx="24" cy="33" r="5.5" fill="#1a2a1e"/>
    <circle cx="40" cy="33" r="5.5" fill="#1a2a1e"/>
    <circle cx="25.5" cy="31" r="2" fill="#9CFFD9"/>
    <circle cx="41.5" cy="31" r="2" fill="#9CFFD9"/>
    {/* Cheeks */}
    <circle cx="11" cy="37" r="5.5" fill="#1a2a1e" opacity="0.12"/>
    <circle cx="53" cy="37" r="5.5" fill="#1a2a1e" opacity="0.12"/>
    {/* Nose */}
    <ellipse cx="32" cy="39" rx="2.5" ry="1.8" fill="#1a2a1e" opacity="0.35"/>
    {/* Mouth */}
    <path d="M27 44 Q32 41 37 44" stroke="#1a2a1e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Body */}
    <ellipse cx="32" cy="58" rx="16" ry="9" fill="#9CFFD9"/>
    {/* Arms */}
    <ellipse cx="12" cy="55" rx="6" ry="3.5" fill="#9CFFD9" transform="rotate(-35 12 55)"/>
    <ellipse cx="52" cy="55" rx="6" ry="3.5" fill="#9CFFD9" transform="rotate(35 52 55)"/>
    {/* Sweat drop */}
    <path d="M53 8 Q56 13 53 16 Q50 13 53 8Z" fill="#1a2a1e" opacity="0.4"/>
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
      style={{ background: '#B6EFD4' }}
    >
      <div className="w-full max-w-md animate-fade-in">

        {/* ── 로고 ── */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-3 mb-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: '#9CFFD9',
                border: '2px solid #1a2a1e',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
              }} />
            ))}
          </div>
          <div className="flex justify-center mb-3">
            <DapdapiSvg />
          </div>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1a2a1e',
            letterSpacing: '0.03em',
          }}>
            답답노트
          </h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: '#3a5a40',
            fontSize: '1rem',
            marginTop: '4px',
          }}>
            또 까먹었지? 나랑 같이 외워. 억지로라도.
          </p>
        </div>

        {/* ── 카드 ── */}
        <div
          style={{
            background: '#B6EFD4',
            borderRadius: '4px 12px 12px 4px',
            border: '2px solid #1a2a1e',
            borderLeft: '5px solid #1a2a1e',
            boxShadow: '4px 4px 0px #1a2a1e',
            padding: '28px 28px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 줄 무늬 배경 */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(#9CFFD9 1px, transparent 1px)',
            backgroundSize: '100% 28px',
            opacity: 0.5,
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
                    background: active ? '#9CFFD9' : 'transparent',
                    color: active ? '#1a2a1e' : '#5a7a60',
                    border: 'none',
                    borderBottom: active ? '3px solid #1a2a1e' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    borderRadius: active ? '8px 8px 0 0' : '0',
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
                boxShadow: '3px 3px 0px rgba(26,42,30,0.25)',
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
                background: '#9CFFD9', color: '#1a2a1e',
                border: '2px solid #1a2a1e', borderRadius: '6px',
                boxShadow: '3px 3px 0px rgba(26,42,30,0.2)',
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
                background: '#1a2a1e', color: '#9CFFD9',
                border: '2px solid #1a2a1e', borderRadius: '6px',
                boxShadow: '3px 3px 0px rgba(26,42,30,0.3)',
                cursor: 'pointer', opacity: socialLoading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {socialLoading === 'apple' ? '연결 중...' : (
                <>
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="#9CFFD9">
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
            <div style={{ flex: 1, height: 1, borderBottom: '1.5px dashed #1a2a1e' }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", color: '#3a5a40', fontSize: '0.9rem' }}>
              또는 이메일로 {isLogin ? '로그인' : '회원가입'}
            </span>
            <div style={{ flex: 1, height: 1, borderBottom: '1.5px dashed #1a2a1e' }} />
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleEmailSubmit} className="space-y-4" style={{ position: 'relative', zIndex: 1 }}>
            <div>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#3a5a40', display: 'block', marginBottom: 4 }}>
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
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#3a5a40', display: 'block', marginBottom: 4 }}>
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
                background: '#9CFFD9', border: '2px solid #1a2a1e',
                borderRadius: '6px', padding: '10px 14px',
                color: '#1a2a1e', fontSize: '0.95rem',
              }}>
                😤 {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center mt-2">
              {loading ? '처리 중...' : isLogin ? '수첩 열기 📖' : '수첩 만들기 ✏️'}
            </button>
          </form>

          <p style={{ fontFamily: "'Nunito', sans-serif", textAlign: 'center', fontSize: '0.9rem', color: '#3a5a40', marginTop: 16 }}>
            {isLogin ? '아직 수첩이 없으세요? ' : '이미 계정이 있으세요? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{ color: '#1a2a1e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Gaegu', sans-serif", textDecoration: 'underline' }}
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
            { icon: '😤', text: '답답이와 함께' },
          ].map(f => (
            <div key={f.text} style={{
              background: '#B6EFD4', borderRadius: '4px 8px 8px 4px',
              border: '2px solid #1a2a1e', borderLeft: '3px solid #1a2a1e',
              padding: '10px 8px', textAlign: 'center',
              boxShadow: '2px 2px 0px #1a2a1e',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{f.icon}</div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#3a5a40' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
