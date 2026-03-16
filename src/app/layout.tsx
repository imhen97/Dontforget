import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Mascot from '@/components/Mascot'
import NicknameGuard from '@/components/NicknameGuard'

export const metadata: Metadata = {
  title: "답답노트 🐱 - 나만의 영단어장",
  description: '고양이와 함께하는 영단어 복습 앱 - AI 예문 생성, Anki 복습 시스템, 커뮤니티',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ backgroundColor: "#fcf6bd" }}>
        <Providers>
          <NicknameGuard />
          {children}
          <Mascot />
        </Providers>
      </body>
    </html>
  )
}
