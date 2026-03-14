import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Don't Forget 📚 - 나만의 영단어장",
  description: '스마트한 영어단어 복습 앱 - AI 예문 생성, Anki 복습 시스템, 커뮤니티',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-pink-50">
        {children}
      </body>
    </html>
  )
}
