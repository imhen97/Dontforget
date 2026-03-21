'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#fcf6bd' }}
    >
      <p className="text-lg font-bold text-[#1a2a1e] mb-2">뭔가 잘못됐다냥 😿</p>
      <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
        잠시 후 다시 시도해보거나, 새로고침해 주세요.
      </p>
      <button
        onClick={reset}
        className="font-bold py-2.5 px-5 rounded-full border-2 border-[#1a2a1e] transition-all hover:bg-[#9CFFD9]"
        style={{ background: '#9CFFD9', color: '#1a2a1e', boxShadow: '3px 3px 0px #1a2a1e' }}
      >
        다시 시도
      </button>
      <a
        href="/"
        className="mt-4 text-sm font-bold text-[#1a2a1e] underline hover:no-underline"
      >
        홈으로
      </a>
    </div>
  )
}
