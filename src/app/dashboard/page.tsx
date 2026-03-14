'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface UserData {
  username: string
  dailyGoal: number
  streak: number
  todayWordsCount: number
}

interface Stats {
  totalWords: number
  dueToday: number
  accuracy: number
  weeklyActivity: Array<{ date: string; label: string; added: number; quizzed: number }>
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true)
  const [goalInput, setGoalInput] = useState('')
  const [showGoalEdit, setShowGoalEdit] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([userData, statsData]) => {
      setUser(userData)
      setStats(statsData)
      setGoalInput(String(userData.dailyGoal || 5))
      setLoading(false)
    })
  }, [])

  const updateGoal = async () => {
    const goal = parseInt(goalInput)
    if (goal < 1 || goal > 10) return
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoal: goal }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(prev => prev ? { ...prev, dailyGoal: data.dailyGoal } : null)
      setShowGoalEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">📚</div>
      </div>
    )
  }

  const todayProgress = user ? Math.min((user.todayWordsCount / user.dailyGoal) * 100, 100) : 0

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            안녕하세요, {user?.username}님! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">오늘도 단어를 공부해볼까요?</p>
        </div>

        {/* Streak + Goal row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-orange-500">{user?.streak || 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">연속 학습일</div>
          </div>

          <div className="card text-center">
            <div className="text-3xl mb-1">🎯</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-pink-500">
                {user?.todayWordsCount || 0}
              </span>
              <span className="text-gray-400 text-sm">/ {user?.dailyGoal}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">오늘 목표</div>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">📅 오늘의 진행률</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{Math.round(todayProgress)}%</span>
              <button
                onClick={() => setShowGoalEdit(!showGoalEdit)}
                className="text-xs text-pink-500 hover:underline"
              >
                목표 수정
              </button>
            </div>
          </div>

          {showGoalEdit && (
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                min="1"
                max="10"
                className="input-field text-sm py-1.5 w-20"
              />
              <button onClick={updateGoal} className="btn-primary text-sm py-1.5 px-3">
                저장
              </button>
              <button onClick={() => setShowGoalEdit(false)} className="btn-ghost text-sm py-1.5">
                취소
              </button>
            </div>
          )}

          <div className="w-full bg-pink-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-pink-400 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
          {todayProgress >= 100 && (
            <p className="text-center text-sm text-pink-600 font-semibold mt-2">
              🎉 오늘 목표 달성! 대단해요!
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card text-center">
            <div className="text-lg font-bold text-purple-500">{stats?.totalWords || 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">전체 단어</div>
          </div>
          <div className="card text-center">
            <div className="text-lg font-bold text-red-500">{stats?.dueToday || 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">복습 예정</div>
          </div>
          <div className="card text-center">
            <div className="text-lg font-bold text-green-500">{stats?.accuracy || 0}%</div>
            <div className="text-xs text-gray-500 mt-0.5">정답률</div>
          </div>
        </div>

        {/* Weekly activity */}
        {stats?.weeklyActivity && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 이번 주 활동</h3>
            <div className="flex items-end justify-between gap-1 h-16">
              {stats.weeklyActivity.map(day => {
                const maxVal = Math.max(...stats.weeklyActivity.map(d => d.added + d.quizzed), 1)
                const height = ((day.added + day.quizzed) / maxVal) * 100
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-pink-400 to-pink-300 rounded-t-md transition-all"
                      style={{ height: `${height}%`, minHeight: day.added + day.quizzed > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-400">{day.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/words?add=1" className="card flex items-center gap-3 hover:bg-pink-50 transition-colors cursor-pointer">
            <span className="text-2xl">➕</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">단어 추가</div>
              <div className="text-xs text-gray-500">새 단어를 저장해요</div>
            </div>
          </Link>

          <Link href="/quiz" className="card flex items-center gap-3 hover:bg-pink-50 transition-colors cursor-pointer">
            <span className="text-2xl">✏️</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">퀴즈 시작</div>
              <div className="text-xs text-gray-500">
                {stats?.dueToday ? `${stats.dueToday}개 복습 예정` : '랜덤 퀴즈'}
              </div>
            </div>
          </Link>

          <Link href="/stats" className="card flex items-center gap-3 hover:bg-pink-50 transition-colors cursor-pointer">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">내 통계</div>
              <div className="text-xs text-gray-500">학습 현황 보기</div>
            </div>
          </Link>

          <Link href="/leaderboard" className="card flex items-center gap-3 hover:bg-pink-50 transition-colors cursor-pointer">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">리더보드</div>
              <div className="text-xs text-gray-500">순위 확인하기</div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
