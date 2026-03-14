'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface LeaderboardUser {
  rank: number
  id: string
  username: string
  wordCount: number
  correctAnswers: number
  streak: number
  level: string
  score: number
  isMe: boolean
}

const LEVEL_EMOJI: Record<string, string> = {
  Beginner: '🌱',
  Elementary: '🌿',
  Intermediate: '🌳',
  'Upper-Intermediate': '⭐',
  Advanced: '💫',
  Proficient: '👑',
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
  2: 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200',
  3: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200',
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [myRank, setMyRank] = useState<LeaderboardUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setLeaderboard(data.leaderboard || [])
        setMyRank(data.myRank || null)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">🏆</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="page-title">🏆 리더보드</h1>
        <p className="text-gray-500 text-sm mb-6">단어 추가 · 정답 · 연속 학습일로 순위가 결정됩니다</p>

        {/* My rank card */}
        {myRank && (
          <div className="card mb-5 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
            <div className="text-xs text-pink-500 font-medium mb-1">내 순위</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-pink-500">#{myRank.rank}</div>
              <div>
                <div className="font-bold text-gray-800">{myRank.username}</div>
                <div className="text-xs text-gray-500">
                  {LEVEL_EMOJI[myRank.level]} {myRank.level} · {myRank.score.toLocaleString()} 점
                </div>
              </div>
              <div className="ml-auto text-right text-xs text-gray-500">
                <div>{myRank.wordCount} 단어</div>
                <div>🔥 {myRank.streak}일</div>
              </div>
            </div>
          </div>
        )}

        {/* Scoring guide */}
        <div className="bg-white rounded-2xl border border-pink-100 p-3 mb-4">
          <div className="flex gap-4 text-xs text-gray-500 justify-around">
            <span>📖 단어 추가 +10점</span>
            <span>✓ 정답 +5점</span>
            <span>🔥 연속일 +20점</span>
          </div>
        </div>

        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-6">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, podiumIdx) => {
              const heights = ['h-24', 'h-32', 'h-20']
              const medals = ['🥈', '🥇', '🥉']
              return (
                <div key={user.id} className={`flex-1 flex flex-col items-center ${user.isMe ? 'ring-2 ring-pink-400 rounded-2xl' : ''}`}>
                  <div className="text-2xl mb-1">{medals[podiumIdx]}</div>
                  <div className="text-xs font-bold text-gray-700 mb-1 truncate max-w-full px-1">{user.username}</div>
                  <div
                    className={`${heights[podiumIdx]} w-full rounded-t-xl flex items-start pt-2 justify-center text-white text-xs font-bold ${
                      podiumIdx === 1 ? 'bg-gradient-to-b from-yellow-400 to-amber-500' :
                      podiumIdx === 0 ? 'bg-gradient-to-b from-gray-300 to-gray-400' :
                      'bg-gradient-to-b from-orange-400 to-orange-500'
                    }`}
                  >
                    #{user.rank}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        <div className="space-y-2">
          {leaderboard.map(user => (
            <div
              key={user.id}
              className={`card flex items-center gap-3 transition-all ${
                user.isMe ? 'ring-2 ring-pink-400' : ''
              } ${RANK_STYLES[user.rank] || ''}`}
            >
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-sm flex-shrink-0 ${
                user.rank === 1 ? 'bg-yellow-400 text-white' :
                user.rank === 2 ? 'bg-gray-300 text-white' :
                user.rank === 3 ? 'bg-orange-400 text-white' :
                'bg-pink-100 text-pink-500'
              }`}>
                {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `${user.rank}`}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-800 truncate">{user.username}</span>
                  {user.isMe && <span className="tag bg-pink-100 text-pink-500 text-[10px]">나</span>}
                  <span className="text-sm">{LEVEL_EMOJI[user.level]}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {user.level} · 📖 {user.wordCount} · 🔥 {user.streak}일
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-bold text-pink-500 text-sm">{user.score.toLocaleString()}</div>
                <div className="text-xs text-gray-400">점</div>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🏆</div>
              <p>아직 순위가 없어요. 단어를 추가해보세요!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
