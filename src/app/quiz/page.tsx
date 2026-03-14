'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'

interface QuizQuestion {
  wordId: string
  word: string
  translation: string
  exampleEn: string
  type: 'en_to_ko' | 'ko_to_en' | 'fill_blank'
  choices: string[]
  correctIndex: number
}

type QuizMode = 'menu' | 'quiz' | 'result'

const QUIZ_TYPES = [
  { id: 'daily', icon: '📅', title: '오늘의 복습', desc: 'Anki 방식 - 복습 예정 단어', color: 'from-pink-400 to-pink-500' },
  { id: 'weekly_wrong', icon: '❌', title: '틀린 문제 모음', desc: '최근 1주일 오답 단어', color: 'from-red-400 to-red-500' },
  { id: 'random', icon: '🎲', title: '랜덤 퀴즈', desc: '전체 단어 중 랜덤', color: 'from-purple-400 to-purple-500' },
]

export default function QuizPage() {
  const [mode, setMode] = useState<QuizMode>('menu')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [sessionId, setSessionId] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [loading, setLoading] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [quizType, setQuizType] = useState('')

  const startQuiz = async (type: string) => {
    setLoading(true)
    setQuizType(type)

    try {
      let questions: QuizQuestion[]
      let sId: string

      if (type === 'daily') {
        const [dailyRes, sessionRes] = await Promise.all([
          fetch('/api/quiz/daily').then(r => r.json()),
          fetch('/api/quiz/extra').then(r => r.json()),
        ])

        if (!dailyRes.questions?.length) {
          alert(dailyRes.message || '퀴즈할 단어가 없습니다!')
          setLoading(false)
          return
        }
        questions = dailyRes.questions
        sId = sessionRes.sessionId
      } else {
        const res = await fetch('/api/quiz/extra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        })
        const data = await res.json()

        if (!data.questions?.length) {
          alert(data.message || '퀴즈할 단어가 없습니다!')
          setLoading(false)
          return
        }
        questions = data.questions
        sId = data.sessionId
      }

      setQuestions(questions)
      setSessionId(sId)
      setCurrentIdx(0)
      setScore(0)
      setAnswers([])
      setSelected(null)
      setShowAnswer(false)
      setStartTime(Date.now())
      setMode('quiz')
    } catch {
      alert('퀴즈를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (choiceIdx: number) => {
    if (showAnswer) return
    setSelected(choiceIdx)
    setShowAnswer(true)

    const current = questions[currentIdx]
    const correct = choiceIdx === current.correctIndex
    const responseTime = Date.now() - startTime

    await fetch('/api/quiz/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, wordId: current.wordId, correct, responseTime }),
    })

    if (correct) setScore(s => s + 1)
    setAnswers(prev => [...prev, correct])
  }

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      // Save final score
      fetch('/api/quiz/extra', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score: score + (selected === questions[currentIdx].correctIndex ? 1 : 0), total: questions.length }),
      })
      setMode('result')
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setShowAnswer(false)
      setStartTime(Date.now())
    }
  }

  const getQuestionText = (q: QuizQuestion) => {
    if (q.type === 'en_to_ko') return { question: q.word, hint: '이 단어의 한국어 뜻은?' }
    if (q.type === 'ko_to_en') return { question: q.translation, hint: '이 뜻에 해당하는 영단어는?' }
    // fill_blank
    const blanked = q.exampleEn.replace(new RegExp(q.word, 'gi'), '______')
    return { question: blanked, hint: '빈칸에 알맞은 단어는?' }
  }

  if (mode === 'menu') {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="page-title">✏️ 퀴즈</h1>
          <p className="text-gray-500 text-sm mb-6">어떤 방식으로 공부할까요?</p>

          <div className="space-y-3">
            {QUIZ_TYPES.map(qt => (
              <button
                key={qt.id}
                onClick={() => startQuiz(qt.id)}
                disabled={loading}
                className={`w-full bg-gradient-to-r ${qt.color} text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition-all active:scale-[0.98] shadow-sm`}
              >
                <span className="text-3xl">{qt.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-lg">{qt.title}</div>
                  <div className="text-sm opacity-90">{qt.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 card">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">💡 Anki 복습 시스템이란?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              SM-2 알고리즘을 활용하여 맞힌 단어는 더 긴 간격으로, 틀린 단어는 더 자주 복습하도록 자동 조정됩니다.
              꾸준히 복습하면 장기 기억에 효과적이에요! 🧠
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (mode === 'result') {
    const total = questions.length
    const pct = Math.round((score / total) * 100)
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '👏' : pct >= 50 ? '💪' : '📚'
    const message = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 50 ? '좀 더 노력해봐요!' : '다시 도전해봐요!'

    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-10 animate-fade-in">
            <div className="text-6xl mb-4">{emoji}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{message}</h2>
            <p className="text-gray-500 text-sm mb-6">퀴즈가 끝났어요!</p>

            <div className="card mb-6">
              <div className="text-4xl font-bold text-pink-500 mb-1">{score} / {total}</div>
              <div className="text-gray-500 text-sm">정답률 {pct}%</div>

              <div className="w-full bg-pink-100 rounded-full h-3 mt-4">
                <div
                  className="bg-gradient-to-r from-pink-400 to-pink-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Answer breakdown */}
            <div className="flex justify-center gap-1 flex-wrap mb-6">
              {answers.map((correct, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}
                >
                  {correct ? '✓' : '✗'}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => startQuiz(quizType)} className="btn-primary flex-1">
                다시 도전 🔄
              </button>
              <button onClick={() => setMode('menu')} className="btn-secondary flex-1">
                메뉴로
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Quiz mode
  const current = questions[currentIdx]
  const { question, hint } = getQuestionText(current)
  const progress = ((currentIdx + 1) / questions.length) * 100

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setMode('menu')} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{currentIdx + 1} / {questions.length}</span>
              <span>점수: {score}</span>
            </div>
            <div className="w-full bg-pink-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-4 text-center animate-fade-in">
          <div className="text-xs text-pink-500 font-medium mb-3 uppercase tracking-wide">{hint}</div>
          <div className="text-2xl font-bold text-gray-800 mb-2 leading-snug">{question}</div>
          {current.type !== 'fill_blank' && current.exampleEn && (
            <p className="text-sm text-gray-400 italic mt-2">예: {current.exampleEn}</p>
          )}
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-3">
          {current.choices.map((choice, i) => {
            let style = 'bg-white border-2 border-pink-200 text-gray-700 hover:border-pink-400'
            if (showAnswer) {
              if (i === current.correctIndex) style = 'bg-green-100 border-2 border-green-400 text-green-700 font-semibold'
              else if (i === selected && i !== current.correctIndex) style = 'bg-red-100 border-2 border-red-400 text-red-600'
              else style = 'bg-gray-50 border-2 border-gray-200 text-gray-400'
            } else if (selected === i) {
              style = 'bg-pink-100 border-2 border-pink-400 text-pink-700'
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={showAnswer}
                className={`${style} rounded-xl p-3 text-sm text-center transition-all active:scale-95 min-h-[60px] flex items-center justify-center`}
              >
                {choice}
              </button>
            )
          })}
        </div>

        {showAnswer && (
          <div className="mt-4 animate-fade-in">
            <div className={`card text-center mb-4 ${selected === current.correctIndex ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="text-2xl mb-1">{selected === current.correctIndex ? '🎉' : '😅'}</div>
              <div className={`font-semibold ${selected === current.correctIndex ? 'text-green-700' : 'text-red-600'}`}>
                {selected === current.correctIndex ? '정답이에요!' : `정답: ${current.choices[current.correctIndex]}`}
              </div>
            </div>
            <button onClick={nextQuestion} className="btn-primary w-full">
              {currentIdx + 1 >= questions.length ? '결과 보기 🎊' : '다음 문제 →'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
