'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '🏠', label: '홈' },
  { href: '/words',     icon: '📖', label: '단어장' },
  { href: '/review',    icon: '📝', label: '복습장' },
  { href: '/settings',  icon: '⚙️', label: '설정' },
]

const DapdapiSvg = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Hair spikes */}
    <polygon points="14,24 18,10 25,25" fill="#1a2a1e"/>
    <polygon points="24,19 28,5 33,19" fill="#1a2a1e"/>
    <polygon points="32,19 37,5 41,19" fill="#1a2a1e"/>
    <polygon points="40,25 47,10 51,24" fill="#1a2a1e"/>
    {/* Head */}
    <circle cx="32" cy="34" r="21" fill="#9CFFD9"/>
    {/* Eyebrows (furrowed) */}
    <line x1="17" y1="26" x2="26" y2="29" stroke="#1a2a1e" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="38" y1="29" x2="47" y2="26" stroke="#1a2a1e" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Eyes */}
    <circle cx="24" cy="34" r="5.5" fill="#1a2a1e"/>
    <circle cx="40" cy="34" r="5.5" fill="#1a2a1e"/>
    <circle cx="25.5" cy="32" r="2" fill="#9CFFD9"/>
    <circle cx="41.5" cy="32" r="2" fill="#9CFFD9"/>
    {/* Cheeks */}
    <circle cx="12" cy="38" r="5" fill="#1a2a1e" opacity="0.15"/>
    <circle cx="52" cy="38" r="5" fill="#1a2a1e" opacity="0.15"/>
    {/* Nose */}
    <ellipse cx="32" cy="40" rx="2.2" ry="1.6" fill="#1a2a1e" opacity="0.4"/>
    {/* Mouth (grimace) */}
    <path d="M27 45 Q32 42 37 45" stroke="#1a2a1e" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
)

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      {/* ── 데스크탑 헤더 ── */}
      <header
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-5 justify-between"
        style={{
          background: '#9CFFD9',
          borderBottom: '2.5px solid #1a2a1e',
          boxShadow: '0 3px 0px rgba(26,42,30,0.1)',
        }}
      >
        {/* 스프링 구멍 */}
        <div className="flex items-center gap-1.5 mr-4">
          {[0,1,2].map(i => <div key={i} className="notebook-hole" />)}
        </div>

        {/* 로고 */}
        <Link href="/dashboard" className="flex items-center gap-2 select-none mr-6">
          <DapdapiSvg size={30} />
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a2a1e', letterSpacing: '0.01em' }}>
            답답노트
          </span>
        </Link>

        {/* 네비 탭 */}
        <nav className="flex items-end gap-1 flex-1">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-1.5 text-sm transition-all duration-150"
                style={{
                  fontWeight: active ? 800 : 600,
                  borderRadius: '10px 10px 0 0',
                  background: active ? '#9CFFD9' : 'transparent',
                  color: active ? '#1a2a1e' : '#5a7a60',
                  border: active ? '2.5px solid #1a2a1e' : '2.5px solid transparent',
                  borderBottom: active ? '2.5px solid #9CFFD9' : '2.5px solid #9CFFD9',
                  marginBottom: active ? '-2.5px' : '0',
                  padding: active ? '6px 14px 10px' : '6px 14px',
                  fontSize: '0.88rem',
                  boxShadow: active ? '0 -2px 6px rgba(26,42,30,0.08)' : 'none',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <button onClick={handleLogout} className="btn-ghost ml-4">로그아웃</button>
      </header>

      {/* ── 모바일 하단 탭 ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 h-16"
        style={{
          background: '#9CFFD9',
          borderTop: '2.5px solid #1a2a1e',
          boxShadow: '0 -3px 0px rgba(26,42,30,0.08)',
        }}
      >
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 transition-all duration-150"
              style={{
                paddingTop: active ? '4px' : '7px',
                paddingBottom: '4px',
                background: active ? '#9CFFD9' : 'transparent',
                borderRadius: active ? '12px' : '0',
                color: active ? '#1a2a1e' : '#5a7a60',
                minWidth: 44,
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: active ? 800 : 500 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden md:block h-14" />
    </>
  )
}
