'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const MESSAGES_BY_PATH: Record<string, string[]> = {
  '/dashboard': [
    '{name}아, 오늘도 왔어? 그래 잘했어.',
    '하... 또 까먹었지? 알고 있었어.',
    '{name}, 공부 안 하면 나 진짜 답답하다.',
    '오늘 목표 정했어? 빨리 해.',
    '게으름 피우지 마. 진짜로.',
    '단어 몇 개나 외웠어? 솔직히 말해봐.',
    '나랑 같이 하면 어떻게든 되긴 해.',
    '오늘도 화이팅이야, {name}. 억지로라도.',
    '복습할 거 다 했어? 안 했지?',
    '새 단어 추가해. 지금 당장.',
    '목표 달성하면 나도 기쁘긴 해... 별로 안 표나지만.',
    '연속 출석 이어가. 끊으면 진짜 답답해.',
    '내일도 와. 안 오면 내가 더 답답하니까.',
    '꾸준히 해. 방법이 없어.',
    '응원은 하고 있어. 겉으론 안 티 내지만.',
  ],
  '/words': [
    '{name}아, 이 단어도 몰랐어? 하...',
    '추가만 하고 안 외우면 의미없어.',
    '저번에도 까먹었잖아...',
    '복습 버튼 눌러. 제발.',
    '단어장 펼쳐봤어? 안 봤지?',
    '새 단어 추가해봐. 뭐라도 해.',
    '예문까지 보면 더 좋아. 진짜로.',
    '스크롤만 하지 말고 외워.',
    '저번에 틀린 거 기억나? 아 몰라?',
    '다시 한 번만 더 보자. 마지막으로.',
    '반복이 답이야. 다른 방법 없어.',
    '한 개라도 더 외워. 지금.',
    '까먹기 전에 다시 봐.',
  ],
  '/review': [
    '{name}아, 복습장에 메모해둬.',
    '그날그날 새로 알게 된 거 적어둬.',
    '요약 정리해두면 나중에 좋아. 믿어.',
    '메모만 하고 안 보면 의미없어.',
    '복습장이 제일 유용한 거 알아? 모르겠지.',
    '오늘 뭐 배웠어? 여기 적어.',
    '정리하는 습관 들여.',
    'AI한테 맡기고 넌 외우기만 해.',
    '한 줄이라도 적어둬.',
    '다시 보면 기억나. 진짜로.',
  ],
  '/stats': [
    '{name}아, 숫자가 부끄럽지 않아?',
    '더 열심히 해. 이게 최선이야?',
    '어제보다 나아졌어? 솔직히 말해봐.',
    '기록 확인해봐. 외면하지 말고.',
    '어제보다 나아지면 돼. 그거면 충분해.',
    '포기하지 마. 지금 그러면 진짜 답답해.',
    '오늘도 고생 많았어, {name}. 진심으로.',
    '조금만 더 해봐.',
  ],
  '/leaderboard': [
    '꼴등은 아니겠지, {name}...',
    '1등 할 자신 있어? 없으면 만들어.',
    '남들은 벌써 저만큼 했어.',
    '친구들한테 지면 안 돼.',
    '할 수 있어. 사실 나도 알아.',
    '꾸준히 하면 돼. 다른 방법 없어.',
  ],
  '/community': [
    '남 단어 구경 말고 내 것이나 외워.',
    '공유도 좋지만 복습이 먼저야.',
    '{name}아, 남의 글만 보지 마.',
    '자기 단어장부터 채워.',
  ],
}

const DEFAULT_MESSAGES = [
  '또 까먹었지? 알고 있었어.',
  '나 여기 있어. 감시 중이야.',
  '공부 좀 해. 제발.',
  '오늘도 같이 하자. 억지로라도.',
  '클릭하면 말해줄게. 답답하지만.',
  '하... 그래도 화이팅이야.',
]

function pickMessage(pathname: string, name: string): string {
  const path = Object.keys(MESSAGES_BY_PATH).find(k => pathname.startsWith(k))
  const pool = path ? MESSAGES_BY_PATH[path] : DEFAULT_MESSAGES
  const raw = pool[Math.floor(Math.random() * pool.length)]
  const displayName = name?.trim() || '친구'
  return raw.replace(/{name}/g, displayName)
}

const DapdapiCharacter = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hair spikes */}
    <polygon points="14,24 18,10 25,25" fill="#1a2a1e"/>
    <polygon points="24,19 28,5 33,19" fill="#1a2a1e"/>
    <polygon points="32,19 37,5 41,19" fill="#1a2a1e"/>
    <polygon points="40,25 47,10 51,24" fill="#1a2a1e"/>
    {/* Head */}
    <circle cx="32" cy="33" r="21" fill="#9CFFD9"/>
    {/* Eyebrows (furrowed/frustrated) */}
    <line x1="16" y1="25" x2="26" y2="28" stroke="#1a2a1e" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="38" y1="28" x2="48" y2="25" stroke="#1a2a1e" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Eyes */}
    <circle cx="24" cy="33" r="5.5" fill="#1a2a1e"/>
    <circle cx="40" cy="33" r="5.5" fill="#1a2a1e"/>
    <circle cx="25.5" cy="31" r="2" fill="#9CFFD9"/>
    <circle cx="41.5" cy="31" r="2" fill="#9CFFD9"/>
    {/* Chubby cheeks */}
    <circle cx="11" cy="37" r="5.5" fill="#1a2a1e" opacity="0.12"/>
    <circle cx="53" cy="37" r="5.5" fill="#1a2a1e" opacity="0.12"/>
    {/* Nose */}
    <ellipse cx="32" cy="39" rx="2.5" ry="1.8" fill="#1a2a1e" opacity="0.35"/>
    {/* Mouth (exasperated grimace) */}
    <path d="M27 44 Q32 41 37 44" stroke="#1a2a1e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Body (chubby round) */}
    <ellipse cx="32" cy="58" rx="16" ry="9" fill="#9CFFD9"/>
    {/* Stubby arms */}
    <ellipse cx="12" cy="55" rx="6" ry="3.5" fill="#9CFFD9" transform="rotate(-35 12 55)"/>
    <ellipse cx="52" cy="55" rx="6" ry="3.5" fill="#9CFFD9" transform="rotate(35 52 55)"/>
    {/* Sweat drop */}
    <path d="M53 8 Q56 13 53 16 Q50 13 53 8Z" fill="#1a2a1e" opacity="0.5"/>
  </svg>
)

export default function Mascot() {
  const pathname = usePathname()
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const [bubbleKey, setBubbleKey] = useState(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => setUsername(data?.username ?? ''))
      .catch(() => setUsername(''))
  }, [])

  const showBubble = (msg: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setMessage(msg)
    setBubbleKey(k => k + 1)
    setBubbleVisible(true)
    hideTimer.current = setTimeout(() => setBubbleVisible(false), 4500)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      showBubble(pickMessage(pathname, username))
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, username])

  const handleClick = () => {
    showBubble(pickMessage(pathname, username))
  }

  if (pathname === '/set-nickname') return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {/* Speech bubble */}
      {bubbleVisible && (
        <div
          key={bubbleKey}
          style={{
            background: '#1a2a1e',
            border: '2.5px solid #9CFFD9',
            borderRadius: '18px 18px 4px 18px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#9CFFD9',
            maxWidth: 220,
            whiteSpace: 'normal',
            lineHeight: 1.35,
            boxShadow: '0 4px 16px rgba(26,42,30,0.2)',
            fontFamily: "'Nunito', sans-serif",
            animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: 'none',
            position: 'relative',
          }}
        >
          {message}
          <span
            style={{
              position: 'absolute',
              bottom: -10,
              right: 18,
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '10px solid #9CFFD9',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: -7,
              right: 19,
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '9px solid #1a2a1e',
            }}
          />
        </div>
      )}

      {/* 답답이 character */}
      <button
        onClick={handleClick}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          cursor: 'pointer',
          animation: 'bounce-light 1.8s ease-in-out infinite',
          pointerEvents: 'auto',
          outline: 'none',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="클릭하면 말해줄게. 답답하지만."
      >
        <DapdapiCharacter />
      </button>
    </div>
  )
}
