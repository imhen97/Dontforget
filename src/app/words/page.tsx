'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'

interface Word {
  id: string
  word: string
  translation: string
  exampleEn: string
  exampleKo: string
  topic: string
  mastered: boolean
  difficulty: number
  createdAt: string
}

const TOPICS = ['all', 'Business', 'Academic', 'Daily Life', 'Travel', 'Technology', 'Nature', 'Emotions', 'Food', 'Health', 'General']
const DIFFICULTY_LABELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const DIFFICULTY_COLORS = ['', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700', 'bg-purple-100 text-purple-700']

function WordsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(searchParams.get('add') === '1')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const [form, setForm] = useState({
    word: '',
    translation: '',
    exampleEn: '',
    exampleKo: '',
    topic: 'General',
  })

  const [editForm, setEditForm] = useState<Partial<Word>>({})
  const [formError, setFormError] = useState('')

  const fetchWords = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedTopic !== 'all') params.set('topic', selectedTopic)
    if (search) params.set('search', search)

    const res = await fetch(`/api/words?${params}`)
    const data = await res.json()
    setWords(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [selectedTopic, search])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setAiLoading(true)

    try {
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setFormError('이미 저장된 단어입니다!')
        } else {
          setFormError(data.error || '오류가 발생했습니다')
        }
        return
      }

      setWords(prev => [data, ...prev])
      setForm({ word: '', translation: '', exampleEn: '', exampleKo: '', topic: 'General' })
      setShowAddModal(false)
      router.replace('/words')
    } catch {
      setFormError('오류가 발생했습니다')
    } finally {
      setAiLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 단어를 삭제할까요?')) return
    await fetch(`/api/words/${id}`, { method: 'DELETE' })
    setWords(prev => prev.filter(w => w.id !== id))
  }

  const handleMastered = async (word: Word) => {
    const res = await fetch(`/api/words/${word.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mastered: !word.mastered }),
    })
    if (res.ok) {
      const updated = await res.json()
      setWords(prev => prev.map(w => w.id === word.id ? updated : w))
    }
  }

  const handleEdit = async (id: string) => {
    const res = await fetch(`/api/words/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setWords(prev => prev.map(w => w.id === id ? updated : w))
      setEditId(null)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">📖 내 단어장</h1>
            <p className="text-gray-500 text-sm">{words.length}개의 단어</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5">
            <span>➕</span> 단어 추가
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 단어 검색..."
          className="input-field mb-4"
        />

        {/* Topic Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {TOPICS.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedTopic === t
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-600 border border-pink-200 hover:bg-pink-50'
              }`}
            >
              {t === 'all' ? '전체' : t}
            </button>
          ))}
        </div>

        {/* Word List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : words.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">단어가 없어요</p>
            <p className="text-gray-400 text-sm mt-1">단어를 추가해보세요!</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
              첫 단어 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {words.map(word => (
              <div key={word.id} className="card">
                {editId === word.id ? (
                  // Edit mode
                  <div className="space-y-2">
                    <input
                      className="input-field text-sm"
                      value={editForm.word ?? word.word}
                      onChange={e => setEditForm(p => ({ ...p, word: e.target.value }))}
                      placeholder="영단어"
                    />
                    <input
                      className="input-field text-sm"
                      value={editForm.translation ?? word.translation}
                      onChange={e => setEditForm(p => ({ ...p, translation: e.target.value }))}
                      placeholder="한국어 번역"
                    />
                    <input
                      className="input-field text-sm"
                      value={editForm.exampleEn ?? word.exampleEn}
                      onChange={e => setEditForm(p => ({ ...p, exampleEn: e.target.value }))}
                      placeholder="영어 예문"
                    />
                    <input
                      className="input-field text-sm"
                      value={editForm.exampleKo ?? word.exampleKo}
                      onChange={e => setEditForm(p => ({ ...p, exampleKo: e.target.value }))}
                      placeholder="한국어 예문"
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleEdit(word.id)} className="btn-primary text-sm py-1.5 px-3">저장</button>
                      <button onClick={() => setEditId(null)} className="btn-ghost text-sm py-1.5">취소</button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-gray-800 text-lg ${word.mastered ? 'line-through text-gray-400' : ''}`}>
                            {word.word}
                          </span>
                          {word.difficulty > 0 && (
                            <span className={`tag text-xs ${DIFFICULTY_COLORS[word.difficulty]}`}>
                              {DIFFICULTY_LABELS[word.difficulty]}
                            </span>
                          )}
                          {word.mastered && <span className="tag bg-green-100 text-green-600">✓ 암기 완료</span>}
                        </div>
                        <p className="text-gray-600 text-sm mt-0.5">{word.translation}</p>
                      </div>

                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleMastered(word)}
                          title={word.mastered ? '학습 중으로 변경' : '암기 완료로 표시'}
                          className={`p-1.5 rounded-lg transition-colors ${word.mastered ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-green-50'}`}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => { setEditId(word.id); setEditForm({}) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(word.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {expandedId === word.id && (
                      <div className="mt-3 pt-3 border-t border-pink-50 animate-fade-in">
                        {word.exampleEn && (
                          <div className="bg-pink-50 rounded-xl p-3 mb-2">
                            <p className="text-sm text-gray-700 italic">"{word.exampleEn}"</p>
                            {word.exampleKo && (
                              <p className="text-xs text-gray-500 mt-1">→ {word.exampleKo}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="tag bg-gray-100 text-gray-600">{word.topic || 'General'}</span>
                          <span>{new Date(word.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">✨ 새 단어 추가</h2>
            <p className="text-sm text-gray-500 mb-5">번역과 예문을 비워두면 AI가 자동으로 생성해요!</p>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">단어 / 숙어 *</label>
                <input
                  value={form.word}
                  onChange={e => setForm({ ...form, word: e.target.value })}
                  className="input-field"
                  placeholder="예: serendipity, break a leg..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  한국어 번역 <span className="text-gray-400 font-normal">(AI 자동 생성)</span>
                </label>
                <input
                  value={form.translation}
                  onChange={e => setForm({ ...form, translation: e.target.value })}
                  className="input-field"
                  placeholder="비워두면 AI가 생성합니다"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  영어 예문 <span className="text-gray-400 font-normal">(AI 자동 생성)</span>
                </label>
                <input
                  value={form.exampleEn}
                  onChange={e => setForm({ ...form, exampleEn: e.target.value })}
                  className="input-field"
                  placeholder="비워두면 AI가 생성합니다"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주제</label>
                <select
                  value={form.topic}
                  onChange={e => setForm({ ...form, topic: e.target.value })}
                  className="input-field"
                >
                  {TOPICS.filter(t => t !== 'all').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-2 text-sm">{formError}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={aiLoading} className="btn-primary flex-1">
                  {aiLoading ? '🤖 AI 생성 중...' : '저장하기'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); router.replace('/words') }}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WordsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce-light">📚</div></div>}>
      <WordsContent />
    </Suspense>
  )
}
