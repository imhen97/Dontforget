'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { RotateCcw, BookOpen, Target } from 'lucide-react'
import { Star } from 'lucide-react'

interface ReviewNote {
  id: string
  title: string
  content: string
  summary: string | null
  createdAt: string
  updatedAt: string
}

interface ReviewQuizQuestion {
  question: string
  choices: string[]
  correctIndex: number
}

type View = 'list' | 'editor' | 'quiz' | 'quizResult'

export default function ReviewPage() {
  const [notes, setNotes] = useState<ReviewNote[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', summary: '' })
  const [aiLoading, setAiLoading] = useState<'title' | 'summary' | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<ReviewQuizQuestion[]>([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizShowAnswer, setQuizShowAnswer] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([])
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchNotes = () => {
    setLoading(true)
    fetch('/api/review-notes')
      .then((r) => r.json())
      .then((data) => {
        setNotes(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const openNew = () => {
    setEditingId(null)
    setForm({ title: '', content: '', summary: '' })
    setView('editor')
  }

  const openEdit = (note: ReviewNote) => {
    setEditingId(note.id)
    setForm({
      title: note.title,
      content: note.content,
      summary: note.summary ?? '',
    })
    setView('editor')
  }

  const saveNote = async () => {
    const payload = { title: form.title.trim() || '제목 없음', content: form.content.trim(), summary: form.summary || null }
    if (editingId) {
      await fetch(`/api/review-notes/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/review-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    fetchNotes()
    setView('list')
  }

  const deleteNote = async (id: string) => {
    if (!confirm('이 메모를 삭제할까요?')) return
    await fetch(`/api/review-notes/${id}`, { method: 'DELETE' })
    fetchNotes()
    if (editingId === id) setView('list')
  }

  const suggestTitle = async () => {
    if (!form.content.trim()) {
      alert('본문을 먼저 적어주세요!')
      return
    }
    setAiLoading('title')
    try {
      const res = await fetch('/api/review-notes/ai/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content }),
      })
      const data: any = await res.json()
      if (data.title) setForm((f) => ({ ...f, title: data.title }))
    } catch {
      alert('제목 추천을 불러오지 못했어요.')
    } finally {
      setAiLoading(null)
    }
  }

  const summarize = async () => {
    if (!form.content.trim()) {
      alert('본문을 먼저 적어주세요!')
      return
    }
    setAiLoading('summary')
    try {
      const res = await fetch('/api/review-notes/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content }),
      })
      const data: any = await res.json()
      if (data.summary) setForm((f) => ({ ...f, summary: data.summary }))
    } catch {
      alert('요약을 불러오지 못했어요.')
    } finally {
      setAiLoading(null)
    }
  }

  const saveSummaryToNote = async () => {
    if (!editingId || !form.summary) return
    await fetch(`/api/review-notes/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: form.summary }),
    })
    fetchNotes()
    alert('요약이 메모에 저장되었어요!')
  }

  const startQuiz = async () => {
    const content = form.content.trim()
    if (!content) {
      alert('본문을 먼저 적어주세요!')
      return
    }
    try {
      const res = await fetch('/api/review-notes/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { noteId: editingId } : { content }),
      })
      const data: any = await res.json()
      if (!data.questions?.length) {
        alert('퀴즈를 만들 수 있는 내용이 부족해요. 조금 더 적어주세요!')
        return
      }
      setQuizQuestions(data.questions)
      setQuizIdx(0)
      setQuizSelected(null)
      setQuizShowAnswer(false)
      setQuizScore(0)
      setQuizAnswers([])
      setView('quiz')
    } catch {
      alert('퀴즈 생성에 실패했어요.')
    }
  }

  const handleQuizAnswer = (choiceIdx: number) => {
    if (quizShowAnswer) return
    setQuizSelected(choiceIdx)
    setQuizShowAnswer(true)
    const correct = choiceIdx === quizQuestions[quizIdx].correctIndex
    if (correct) setQuizScore((s) => s + 1)
    setQuizAnswers((a) => [...a, correct])
  }

  const nextQuizQuestion = () => {
    if (quizIdx + 1 >= quizQuestions.length) {
      setView('quizResult')
    } else {
      setQuizIdx((i) => i + 1)
      setQuizSelected(null)
      setQuizShowAnswer(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' })

  // ── List view ──
  if (view === 'list') {
    return (
      <div className="min-h-screen pb-24 md:pb-6 bg-[#f8f7ff]">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
              복습장
            </h1>
            <p className="text-gray-500 text-sm">복습 모드를 선택하거나 메모를 작성하세요</p>
          </div>

          {/* Review Mode Cards */}
          <div className="space-y-3 mb-6">
            {[
              {
                title: '오늘의 복습 퀴즈',
                description: '단어장 기반 복습 퀴즈',
                icon: BookOpen,
                color: 'from-purple-500 to-purple-600',
                href: '/quiz',
              },
              {
                title: '메모 복습',
                description: '작성한 메모로 AI 퀴즈',
                icon: RotateCcw,
                color: 'from-pink-500 to-rose-600',
                action: openNew,
              },
            ].map((mode, i) => {
              const Icon = mode.icon
              return (
                <button
                  key={i}
                  onClick={mode.action ?? (() => window.location.href = mode.href!)}
                  className={`w-full bg-gradient-to-br ${mode.color} rounded-3xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold mb-0.5">{mode.title}</h3>
                        <p className="text-sm opacity-90">{mode.description}</p>
                      </div>
                    </div>
                    <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Notes Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">내 메모 ({notes.length})</h2>
            <button
              onClick={openNew}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 text-sm flex items-center gap-1.5"
            >
              ✏️ 새 메모
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">불러오는 중...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📒</span>
              </div>
              <p className="text-gray-500 mb-2">아직 메모가 없어요</p>
              <p className="text-gray-400 text-sm mb-4">복습하고 싶은 내용을 적고 AI 제목·요약·퀴즈를 활용해보세요.</p>
              <button onClick={openNew} className="btn-primary">
                첫 메모 쓰기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => openEdit(note)}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 leading-snug mb-1">{note.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {note.summary || note.content || '내용 없음'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">{formatDate(note.updatedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Editor view ──
  if (view === 'editor') {
    return (
      <div className="min-h-screen pb-24 md:pb-6 bg-[#f8f7ff]">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1 text-gray-500 hover:text-purple-600 font-semibold transition-colors"
            >
              ← 목록
            </button>
            <h2 className="text-xl font-bold text-gray-800">{editingId ? '메모 수정' : '새 메모'}</h2>
            {editingId && (
              <button
                onClick={() => deleteNote(editingId)}
                className="ml-auto text-sm font-semibold text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">제목</label>
              <div className="flex gap-2">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="input-field flex-1"
                  placeholder="제목을 입력하거나 AI 추천을 받아보세요"
                />
                <button
                  type="button"
                  onClick={suggestTitle}
                  disabled={aiLoading !== null}
                  className="btn-secondary whitespace-nowrap text-sm px-4"
                  style={{ minHeight: 48 }}
                >
                  {aiLoading === 'title' ? '...' : '✨ AI 제목'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">내용</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="input-field min-h-[180px] resize-none"
                placeholder="그날 복습하고 싶었던 내용, 새로 알게 된 걸 적어보세요"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={summarize}
                disabled={aiLoading !== null}
                className="btn-secondary text-sm"
                style={{ padding: '10px 16px', minHeight: 40 }}
              >
                {aiLoading === 'summary' ? '요약 중...' : '📋 요약 정리하기'}
              </button>
              <button
                type="button"
                onClick={startQuiz}
                className="btn-primary text-sm"
                style={{ padding: '10px 16px', minHeight: 40 }}
              >
                🎯 복습 퀴즈 생성
              </button>
            </div>

            {form.summary && (
              <div className="rounded-2xl p-4 border border-purple-100 bg-purple-50/50">
                <div className="text-xs font-bold text-purple-600 mb-2">📋 AI 요약</div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{form.summary}</p>
                {editingId && (
                  <button
                    type="button"
                    onClick={saveSummaryToNote}
                    className="mt-2 text-xs font-bold text-purple-600 hover:underline"
                  >
                    이 요약을 메모에 저장하기
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={saveNote} className="btn-primary flex-1">
                저장
              </button>
              <button onClick={() => setView('list')} className="btn-secondary">
                취소
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Quiz view ──
  if (view === 'quiz' && quizQuestions.length > 0) {
    const current = quizQuestions[quizIdx]
    const progress = ((quizIdx + 1) / quizQuestions.length) * 100

    return (
      <div className="min-h-screen pb-24 md:pb-6 bg-[#f8f7ff]">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('editor')} className="text-gray-500 hover:text-purple-600 font-bold transition-colors">
              ←
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{quizIdx + 1} / {quizQuestions.length}</span>
                <span>맞힌 개수: {quizScore}</span>
              </div>
              <div className="w-full rounded-full h-2 bg-gray-100">
                <div
                  className="h-2 rounded-full transition-all bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md p-6 mb-4 text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-3">
              복습 퀴즈
            </div>
            <div className="text-lg font-bold text-gray-800 leading-snug">{current.question}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {current.choices.map((choice, i) => {
              let className = 'rounded-2xl p-3 text-sm text-center transition-all active:scale-95 min-h-[56px] flex items-center justify-center font-medium border '
              if (quizShowAnswer) {
                if (i === current.correctIndex) {
                  className += 'bg-green-50 border-green-300 text-green-700'
                } else if (i === quizSelected && i !== current.correctIndex) {
                  className += 'bg-red-50 border-red-300 text-red-700'
                } else {
                  className += 'bg-gray-50 border-gray-200 text-gray-400'
                }
              } else if (quizSelected === i) {
                className += 'bg-purple-50 border-purple-400 text-purple-700'
              } else {
                className += 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
              }
              return (
                <button
                  key={i}
                  onClick={() => handleQuizAnswer(i)}
                  disabled={quizShowAnswer}
                  className={className}
                >
                  {choice}
                </button>
              )
            })}
          </div>

          {quizShowAnswer && (
            <div className="mt-4">
              <div className={`rounded-3xl p-4 text-center mb-4 ${
                quizSelected === current.correctIndex
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="text-2xl mb-1">
                  {quizSelected === current.correctIndex ? '🎉' : '😅'}
                </div>
                <div className={`font-semibold ${quizSelected === current.correctIndex ? 'text-green-700' : 'text-red-700'}`}>
                  {quizSelected === current.correctIndex
                    ? '정답!'
                    : `정답: ${current.choices[current.correctIndex]}`}
                </div>
              </div>
              <button onClick={nextQuizQuestion} className="btn-primary w-full">
                {quizIdx + 1 >= quizQuestions.length ? '결과 보기 🎊' : '다음 →'}
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Quiz result ──
  if (view === 'quizResult') {
    const total = quizQuestions.length
    const pct = total ? Math.round((quizScore / total) * 100) : 0
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '👏' : pct >= 50 ? '💪' : '📚'
    const message = pct >= 90 ? '완벽해요!' : pct >= 70 ? '잘했어요!' : pct >= 50 ? '조금만 더!' : '다시 도전해보세요!'

    return (
      <div className="min-h-screen pb-24 md:pb-6 bg-[#f8f7ff]">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">{emoji}</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{message}</h2>
            <p className="text-gray-500 text-sm mb-6">복습 퀴즈가 끝났어요.</p>

            <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md p-6 mb-6">
              <div className="text-5xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {quizScore} / {total}
              </div>
              <div className="text-sm text-gray-500 mb-4">정답률 {pct}%</div>
              <div className="w-full rounded-full h-3 bg-gray-100">
                <div
                  className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex justify-center gap-1.5 flex-wrap mb-6">
              {quizAnswers.map((correct, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${
                    correct
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                      : 'bg-gradient-to-br from-red-400 to-rose-500 text-white'
                  }`}
                >
                  {correct ? '✓' : '✗'}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setView('quiz'); setQuizIdx(0); setQuizSelected(null); setQuizShowAnswer(false); setQuizScore(0); setQuizAnswers([]) }}
                className="btn-primary flex-1"
              >
                다시 풀기 🔄
              </button>
              <button onClick={() => setView('editor')} className="btn-secondary flex-1">
                메모로
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return null
}
