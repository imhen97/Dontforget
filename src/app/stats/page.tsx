'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface StatsData {
  totalWords: number
  masteredWords: number
  vocabLevel: {
    level: string
    score: number
    totalWords: number
    percentile: number
  } | null
  weeklyActivity: Array<{ date: string; label: string; added: number; quizzed: number }>
  topicBreakdown: Array<{ topic: string; count: number }>
  accuracy: number
  dueToday: number
  streak: number
  dailyGoal: number
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#34D399',
  Elementary: '#60A5FA',
  Intermediate: '#FBBF24',
  'Upper-Intermediate': '#F97316',
  Advanced: '#F87171',
  Proficient: '#A78BFA',
}

const LEVEL_KOREAN: Record<string, string> = {
  Beginner: '입문',
  Elementary: '초급',
  Intermediate: '중급',
  'Upper-Intermediate': '중상급',
  Advanced: '고급',
  Proficient: '원어민급',
}

const PIE_COLORS = ['#FF6B9D', '#A78BFA', '#34D399', '#FBBF24', '#60A5FA', '#F97316', '#F87171', '#06B6D4']

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">📊</div>
      </div>
    )
  }

  if (!stats) return null

  const masteryPct = stats.totalWords > 0 ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0
  const levelColor = LEVEL_COLORS[stats.vocabLevel?.level || 'Beginner']
  const levelKo = LEVEL_KOREAN[stats.vocabLevel?.level || 'Beginner'] || '입문'

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="page-title">📊 내 통계</h1>
        <p className="text-gray-500 text-sm mb-6">학습 현황을 한눈에 확인하세요</p>

        {/* Vocab Level Card */}
        <div className="card mb-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-8xl flex items-center justify-center">
            🎓
          </div>
          <div className="relative">
            <div className="text-xs text-gray-500 font-medium mb-1">내 영어 수준</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold" style={{ color: levelColor }}>
                {levelKo}
              </span>
              <span className="text-lg text-gray-500">({stats.vocabLevel?.level})</span>
            </div>
            {stats.vocabLevel && stats.vocabLevel.percentile > 0 && (
              <div className="text-sm text-gray-600">
                상위 <span className="font-bold text-pink-500">{Math.round(100 - stats.vocabLevel.percentile)}%</span> 에 해당합니다
              </div>
            )}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>입문</span>
                <span>원어민급</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${((stats.vocabLevel?.score || 1) / 6) * 100}%`,
                    backgroundColor: levelColor
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card">
            <div className="text-2xl font-bold text-pink-500">{stats.totalWords}</div>
            <div className="text-xs text-gray-500 mt-0.5">전체 단어</div>
            <div className="text-xs text-gray-400 mt-1">{stats.masteredWords}개 암기 완료 ({masteryPct}%)</div>
            <div className="w-full bg-pink-100 rounded-full h-1.5 mt-2">
              <div className="bg-pink-400 h-1.5 rounded-full" style={{ width: `${masteryPct}%` }} />
            </div>
          </div>

          <div className="card">
            <div className="text-2xl font-bold text-orange-500">{stats.streak}</div>
            <div className="text-xs text-gray-500 mt-0.5">🔥 연속 학습일</div>
            <div className="text-xs text-gray-400 mt-1">정답률 {stats.accuracy}%</div>
          </div>

          <div className="card">
            <div className="text-2xl font-bold text-red-500">{stats.dueToday}</div>
            <div className="text-xs text-gray-500 mt-0.5">오늘 복습 예정</div>
          </div>

          <div className="card">
            <div className="text-2xl font-bold text-purple-500">{stats.dailyGoal}</div>
            <div className="text-xs text-gray-500 mt-0.5">일일 목표 단어</div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">📈 이번 주 학습 활동</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={stats.weeklyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #FFB3CE', fontSize: '12px' }}
                formatter={(value: number, name: string) => [value, name === 'added' ? '추가 단어' : '퀴즈 답변']}
              />
              <Bar dataKey="added" fill="#FF6B9D" radius={[4, 4, 0, 0]} name="added" />
              <Bar dataKey="quizzed" fill="#A78BFA" radius={[4, 4, 0, 0]} name="quizzed" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-pink-400 inline-block"></span>추가 단어</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-400 inline-block"></span>퀴즈 답변</span>
          </div>
        </div>

        {/* Topic Breakdown */}
        {stats.topicBreakdown.length > 0 && (
          <div className="card mb-4">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">🗂️ 주제별 단어 분포</h3>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.topicBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="topic"
                  >
                    {stats.topicBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #FFB3CE', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center">
                {stats.topicBreakdown.map((t, i) => (
                  <div key={t.topic} className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span>{t.topic} ({t.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
