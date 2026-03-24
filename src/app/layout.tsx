import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import NicknameGuard from '@/components/NicknameGuard'
import ThemeSelector from '@/components/ThemeSelector'

export const metadata: Metadata = {
  title: "깜빡 노트 🐱 - 나만의 영단어장",
  description: '고양이와 함께하는 영단어 복습 앱',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ backgroundColor: "#fcf6bd" }}>
        <Providers>
          <NicknameGuard />
          {children}
          <ThemeSelector />
        </Providers>
      </body>
    </html>
  )
}
