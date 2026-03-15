'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, minHeight: '100vh', background: '#fcf6bd', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>뭔가 잘못됐다냥 😿</p>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: 24, textAlign: 'center' }}>잠시 후 새로고침해 주세요.</p>
        <button
          onClick={reset}
          style={{
            fontWeight: 700,
            padding: '10px 20px',
            borderRadius: 99,
            border: '2px solid #1a1a1a',
            background: '#ff99c8',
            color: '#1a1a1a',
            boxShadow: '3px 3px 0px #1a1a1a',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <a href="/" style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>홈으로</a>
      </body>
    </html>
  )
}
