'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '🏠', label: '홈',    color: '#ff99c8' },
  { href: '/words',     icon: '📖', label: '단어장', color: '#e4c1f9' },
  { href: '/review',    icon: '📝', label: '복습장', color: '#ff99c8' },
  { href: '/more',      icon: '···', label: '더보기', color: '#e4c1f9' },
]

const CatSvg = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <polygon points="8,28 18,8 26,26"   fill="#1a1a1a" />
    <polygon points="38,26 46,8 56,28"  fill="#1a1a1a" />
    <polygon points="11,26 18,12 24,25" fill="#ff99c8" />
    <polygon points="40,25 46,12 53,26" fill="#ff99c8" />
    <ellipse cx="32" cy="36" rx="22" ry="20" fill="#1a1a1a" />
    <ellipse cx="24" cy="32" rx="5"  ry="5.5"  fill="#fff" />
    <ellipse cx="40" cy="32" rx="5"  ry="5.5"  fill="#fff" />
    <ellipse cx="24.5" cy="32.5" rx="3" ry="3.5" fill="#3a3038" />
    <ellipse cx="40.5" cy="32.5" rx="3" ry="3.5" fill="#3a3038" />
    <circle cx="26" cy="31" r="1.2" fill="#fff" />
    <circle cx="42" cy="31" r="1.2" fill="#fff" />
    <ellipse cx="32" cy="40" rx="2.5" ry="1.8" fill="#ff99c8" />
    <path d="M29.5 42 Q32 45 34.5 42" stroke="#7a6e78" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <line x1="10" y1="39" x2="27" y2="41" stroke="#7a6e78" strokeWidth="1" strokeLinecap="round"/>
    <line x1="10" y1="42" x2="27" y2="42.5" stroke="#7a6e78" strokeWidth="1" strokeLinecap="round"/>
    <line x1="37" y1="41" x2="54" y2="39" stroke="#7a6e78" strokeWidth="1" strokeLinecap="round"/>
    <line x1="37" y1="42.5" x2="54" y2="42" stroke="#7a6e78" strokeWidth="1" strokeLinecap="round"/>
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
          background: 'var(--yellow)',
          borderBottom: '2.5px solid var(--pink)',
          boxShadow: '0 3px 0px rgba(58,48,56,0.07)',
        }}
      >
        <div className="flex items-center gap-1.5 mr-4">
          {[0,1,2].map(i => <div key={i} className="notebook-hole" />)}
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 select-none mr-6">
          <CatSvg size={30} />
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3a3038', letterSpacing: '0.01em' }}>
            깜빡 노트
          </span>
        </Link>
        <nav className="flex items-end gap-1 flex-1">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-1.5 text-sm transition-all duration-150"
                style={{
                  fontWeight: active ? 800 : 600,
                  borderRadius: '10px 10px 0 0',
                  background: active ? item.color : 'transparent',
                  color: active ? '#3a3038' : '#b8adb6',
                  border: active ? '2.5px solid #e8e0e6' : '2.5px solid transparent',
                  borderBottom: active ? `2.5px solid ${item.color}` : '2.5px solid transparent',
                  marginBottom: active ? '-2.5px' : '0',
                  padding: active ? '6px 14px 10px' : '6px 14px',
                  fontSize: '0.88rem',
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around h-[52px]"
        style={{
          background: 'var(--yellow)',
          borderTop: '2.5px solid var(--pink)',
          boxShadow: '0 -3px 0px rgba(58,48,56,0.05)',
        }}
      >
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-center flex-1 transition-all duration-150 gap-0.5"
              style={{
                background: active ? item.color : 'transparent',
                color: active ? '#3a3038' : '#b8adb6',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: active ? 800 : 600 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden md:block h-14" />
    </>
  )
}
