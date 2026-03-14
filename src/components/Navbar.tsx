'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '🏠', label: '홈' },
  { href: '/words', icon: '📖', label: '단어장' },
  { href: '/quiz', icon: '✏️', label: '퀴즈' },
  { href: '/stats', icon: '📊', label: '통계' },
  { href: '/leaderboard', icon: '🏆', label: '순위' },
  { href: '/community', icon: '💬', label: '커뮤니티' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      {/* Top bar (desktop) */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-pink-100 h-14 items-center px-6 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-pink-600 text-lg">Don&apos;t Forget</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                pathname.startsWith(item.href)
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="btn-ghost text-sm text-gray-500">
          로그아웃
        </button>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-pink-100 flex items-center justify-around px-2 h-16 safe-area-pb">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              pathname.startsWith(item.href) ? 'text-pink-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="hidden md:block h-14" />
    </>
  )
}
