'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, RotateCcw, MoreHorizontal } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home,           label: '홈' },
  { href: '/words',     icon: BookOpen,        label: '단어장' },
  { href: '/review',    icon: RotateCcw,       label: '복습장' },
  { href: '/more',      icon: MoreHorizontal,  label: '더보기' },
]

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
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-5 justify-between bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 select-none mr-6">
          <span style={{ fontSize: '1.5rem' }}>🐱</span>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            깜빡 노트
          </span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="btn-ghost ml-4 text-sm"
          style={{ padding: '8px 16px', minHeight: 36 }}
        >
          로그아웃
        </button>
      </header>

      {/* ── 모바일 하단 탭 ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-3 gap-1 transition-all duration-300 ${
                  active ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-b-full" />
                )}
                <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="hidden md:block h-14" />
    </>
  )
}
