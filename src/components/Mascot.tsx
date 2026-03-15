'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// {name} = 사용자 별명 (없으면 '친구'). 페이지별 냥냥체 멘트 ~100가지
const MESSAGES_BY_PATH: Record<string, string[]> = {
  '/dashboard': [
    '{name} 친구, 오늘도 같이 공부하자냥~ 🐾',
    '{name}아, 냥이가 지켜보고 있다냥 👀',
    '또 까먹었냥, {name}? 😼',
    '오늘 목표 정했냥, {name}?',
    '게으름 피우면 안 된다냥!',
    '단어 몇 개나 외웠냥?',
    '냥이랑 같이 하면 재밌다냥',
    '오늘도 화이팅이냥, {name}! 💪',
    '복습할 거 다 했냥?',
    '새 단어 추가해볼래냥?',
    '퀴즈 풀어보라냥 ✏️',
    '기록 확인해보라냥 📊',
    '순위 올라갔냥? 🏆',
    '목표 달성하면 냥이 기뻐한다냥 🎉',
    '연속 출석 이어가라냥 🔥',
    '내일도 만나자냥, {name}!',
    '꾸준히 하면 된다냥!',
    '냥이도 응원한다냥 😺',
  ],
  '/words': [
    '{name}아, 이 단어도 몰랐냥? 😾',
    '추가만 하고 안 외우면 의미없다냥!',
    '저번에도 까먹었잖냥...',
    '복습 버튼 눌러보라냥!',
    '단어장 펼쳐보라냥 📖',
    '새 단어 추가해봐냥!',
    '예문까지 보면 더 좋다냥',
    '발음도 따라해보라냥 🗣️',
    '스크롤만 하지 말고 외우라냥',
    '저번에 틀린 거 기억나냥?',
    '다시 한 번만 더 보자냥',
    '궁금한 단어 있으면 찾아보라냥',
    '반복이 답이다냥!',
    '한 개라도 더 외워보라냥',
    '복습이 왕도다냥!',
    '까먹기 전에 다시 보라냥',
    '어려운 단어도 도전해보라냥',
    '냥이 말 잘 들어라냥!',
  ],
  '/quiz': [
    '틀리면 냥이가 실망한다냥 😤',
    '{name}아, 이것도 모른다냥?!',
    '집중 좀 해보라냥~ 😼',
    '맞히면 칭찬해줄 수도 있냥...',
    '실수하지 말라냥!',
    '이번엔 맞춰보라냥!',
    '틀려도 괜찮다냥, 다시 하면 돼!',
    '정답률 올려보자냥!',
    '쉬운 거부터 해도 된다냥',
    '집중 모드 온다냥!',
    '잘했으면 칭찬해줘도 된다냥',
    '한 문장이라도 읽어보라냥',
    '기억 안 나면 정상이냥, 다시 보면 돼!',
    '넌 할 수 있냥! 🐱',
    '냥이만 믿어라냥!',
    '여기까지 왔으면 대단하다냥',
    '마지막 한 번만 더 보자냥',
    '오늘의 MVP는 너다냥 🏆',
  ],
  '/stats': [
    '{name}아, 숫자가 부끄럽지 않냥?',
    '이 그래프... 처참하다냥 😑',
    '더 열심히 해보라냥!',
    '어제보다 나아졌냥? 솔직히 말해봐냥',
    '기록 확인해보라냥 📊',
    '비교 말고 성장을 보라냥',
    '어제보다 나아지면 된다냥',
    '작은 걸음이 중요하다냥',
    '매일 보는 게 비결이냥',
    '이번 주 활동 어떻게 했냥?',
    '냥이도 매일 본다냥 📚',
    '포기하지 말라냥!',
    '시작이 반이다냥!',
    '끝까지 가보자냥 🏁',
    '오늘도 고생 많았다냥, {name}!',
    '잘하고 있다냥~ 👏',
    '조금만 더 해보라냥!',
    '냥이 표창 낸다냥! ⭐',
  ],
  '/leaderboard': [
    '꼴등은 아니겠지냥, {name}...',
    '1등 할 자신 있냥? 😏',
    '남들은 벌써 저만큼 했다냥',
    '순위나 구경할 거냥?',
    '순위 올라갔냥? 🏆',
    '친구들한테 지면 안 된다냥!',
    '남 부럽지 말고 나부터 하라냥',
    '우리 같이 갈 수 있다냥 💪',
    '믿어준다냥!',
    '할 수 있다냥! 🐱',
    '여기까지 왔으면 대단하다냥',
    '오늘의 MVP는 너다냥 🏆',
    '냥이도 힘 낸다냥!',
    '다음에 1등 해보라냥!',
    '꾸준히 하면 된다냥',
    '비교 말고 나를 이겨보라냥',
    '연속 출석 이어가라냥 🔥',
    '내일은 더 올라가보자냥!',
  ],
  '/community': [
    '남 단어 구경 말고 내 것이나 외우라냥 😾',
    '친구들한테 지면 안 된다냥!',
    '공유도 좋지만 복습이 먼저다냥',
    '커뮤니티 구경도 좋지만 공부 먼저냥',
    '{name}아, 남의 글만 보지 말라냥',
    '자기 단어장부터 채우라냥',
    '도움 받았으면 고마워하라냥',
    '질문할 거 있으면 올려보라냥',
    '다른 사람도 열심히 한다냥',
    '같이 응원해주는 것도 좋다냥',
    '냥이도 커뮤니티 좋아한다냥 😺',
    '유용한 글 있으면 저장해두라냥',
    '스크롤만 하지 말고 참여해보라냥',
    '친절한 사람 많다냥~',
    '분위기 좋지냥?',
    '우리 다 같이 성장하자냥!',
    '읽기만 해도 도움 된다냥',
    '나중에 나도 도움 줄 수 있다냥',
  ],
  '/review': [
    '{name}아, 복습장에 메모해두라냥 📝',
    '그날그날 새로 알게 된 거 적어두라냥!',
    'AI로 제목 추천 받아보라냥',
    '요약 정리해두면 나중에 좋다냥',
    '복습 퀴즈 만들어서 풀어보라냥',
    '메모만 하고 안 보면 의미없다냥',
    '궁금한 거 적어두고 나중에 보라냥',
    '요약해두면 까먹어도 된다냥',
    '복습장이 제일 비밀 노트다냥',
    '오늘 뭐 배웠냥? 여기 적어봐냥',
    '정리하는 습관 들이자냥',
    'AI한테 맡기고 넌 외우기만 하라냥',
    '메모 많이 쌓이면 냥이 기뻐한다냥',
    '한 줄이라도 적어두라냥',
    '나중에 검색해서 보라냥',
    '복습장·단어장 둘 다 쓰라냥',
    '핵심만 적어두는 게 비결이냥',
    '다시 보면 기억난다냥!',
  ],
}

const DEFAULT_MESSAGES = [
  '또 까먹었냥? 😼',
  '냥이가 감시 중이다냥 👀',
  '공부 좀 하라냥!',
  '오늘도 같이 공부하자냥~',
  '클릭하면 냥이가 말해준다냥',
  '냥이는 여기 있다냥~',
]

function pickMessage(pathname: string, name: string): string {
  const path = Object.keys(MESSAGES_BY_PATH).find(k => pathname.startsWith(k))
  const pool = path ? MESSAGES_BY_PATH[path] : DEFAULT_MESSAGES
  const raw = pool[Math.floor(Math.random() * pool.length)]
  const displayName = name?.trim() || '친구'
  return raw.replace(/{name}/g, displayName)
}

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
            background: '#3a3038',
            border: '2.5px solid #7a6e78',
            borderRadius: '18px 18px 4px 18px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            maxWidth: 220,
            whiteSpace: 'normal',
            lineHeight: 1.35,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            fontFamily: "'Jua', 'Nunito', sans-serif",
            animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: 'none',
            position: 'relative',
          }}
        >
          {message}
          {/* bubble tail */}
          <span
            style={{
              position: 'absolute',
              bottom: -10,
              right: 18,
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '10px solid #7a6e78',
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
              borderTop: '9px solid #3a3038',
            }}
          />
        </div>
      )}

      {/* Black cat character */}
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
        title="클릭해봐냥 😼"
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ears */}
          <polygon points="8,28 18,8 26,26" fill="#1a1a1a" />
          <polygon points="38,26 46,8 56,28" fill="#1a1a1a" />
          {/* Inner ears */}
          <polygon points="11,26 18,12 24,25" fill="#ff9eb5" />
          <polygon points="40,25 46,12 53,26" fill="#ff9eb5" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="22" ry="20" fill="#1a1a1a" />
          {/* Eyes */}
          <ellipse cx="24" cy="32" rx="5" ry="5.5" fill="#fff" />
          <ellipse cx="40" cy="32" rx="5" ry="5.5" fill="#fff" />
          <ellipse cx="24.5" cy="32.5" rx="3" ry="3.5" fill="#222" />
          <ellipse cx="40.5" cy="32.5" rx="3" ry="3.5" fill="#222" />
          {/* Eye shine */}
          <circle cx="26" cy="31" r="1.2" fill="#fff" />
          <circle cx="42" cy="31" r="1.2" fill="#fff" />
          {/* Nose */}
          <ellipse cx="32" cy="40" rx="2.5" ry="1.8" fill="#ff9eb5" />
          {/* Mouth */}
          <path d="M29.5 42 Q32 45 34.5 42" stroke="#666" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          {/* Whiskers left */}
          <line x1="10" y1="39" x2="27" y2="41" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
          <line x1="10" y1="42" x2="27" y2="42.5" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
          {/* Whiskers right */}
          <line x1="37" y1="41" x2="54" y2="39" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
          <line x1="37" y1="42.5" x2="54" y2="42" stroke="#888" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
