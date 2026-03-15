'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Suspense } from 'react'

interface Word {
  id: string
  word: string
  translation: string
  meanings?: string | null
  exampleEn: string
  exampleKo: string
  examples?: string | null
  topic: string
  type: string
  mastered: boolean
  difficulty: number
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: string
  createdAt: string
}

function calcSM2(quality: number, repetitions: number, easeFactor: number, interval: number) {
  const newEF = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  let newReps = repetitions
  let newInterval = interval
  if (quality < 3) {
    newReps = 0
    newInterval = 1
  } else {
    newReps = repetitions + 1
    if (repetitions === 0) newInterval = 1
    else if (repetitions === 1) newInterval = 6
    else newInterval = Math.round(interval * easeFactor)
  }
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  return { easeFactor: newEF, interval: newInterval, repetitions: newReps, nextReview: nextReview.toISOString() }
}

// 선호 음성 우선순위 (자연스러운 순)
const PREFERRED_VOICES = [
  'Samantha', 'Karen', 'Daniel', 'Moira',        // macOS/iOS 고품질
  'Google US English', 'Google UK English Female', // Chrome
  'Microsoft Aria', 'Microsoft Jenny',             // Edge/Windows
]

function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  for (const name of PREFERRED_VOICES) {
    const v = voices.find(v => v.name === name)
    if (v) return v
  }
  // 우선 en-US, 없으면 en-*
  return (
    voices.find(v => v.lang === 'en-US' && v.localService) ??
    voices.find(v => v.lang.startsWith('en') && v.localService) ??
    voices.find(v => v.lang === 'en-US') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  )
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.9   // 살짝 천천히 — 학습에 적합
  utter.pitch = 1.0

  const trySpeak = () => {
    const voice = getBestEnglishVoice()
    if (voice) utter.voice = voice
    window.speechSynthesis.speak(utter)
  }

  // 음성 목록이 아직 로드 안 됐을 때 대기
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true })
  } else {
    trySpeak()
  }
}

const TYPE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  word:     { label: '단어',  bg: '#a9def9', color: '#1a1a1a' },
  phrase:   { label: '숙어',  bg: '#e4c1f9', color: '#1a1a1a' },
  slang:    { label: '슬랭',  bg: '#ff99c8', color: '#1a1a1a' },
  sentence: { label: '문장',  bg: '#d0f4de', color: '#1a1a1a' },
}
const TYPE_OPTIONS = [
  { value: 'word',     label: '단어' },
  { value: 'phrase',   label: '숙어' },
  { value: 'slang',    label: '슬랭' },
  { value: 'sentence', label: '문장' },
]

const DEFAULT_TOPICS = ['Business', 'Academic', 'Daily Life', 'Travel', 'Technology', 'Nature', 'Emotions', 'Food', 'Health', 'General']
const TOPICS = ['all', ...DEFAULT_TOPICS]
const DIFFICULTY_LABELS = ['', '하', '중', '상', '최상']
const DIFFICULTY_COLORS = ['', '#d0f4de', '#a9def9', '#fcf6bd', '#e4c1f9']

function WordsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(searchParams.get('add') === '1')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [dateView, setDateView] = useState<'all' | 'today' | 'range'>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const [form, setForm] = useState({
    word: '',
    translation: '',
    topic: 'General',
  })
  const [examples, setExamples] = useState([{ exampleEn: '', exampleKo: '' }, { exampleEn: '', exampleKo: '' }])
  const exampleTimers = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null, null, null, null])

  const [editForm, setEditForm] = useState<Partial<Word>>({})
  const [editExamples, setEditExamples] = useState<Array<{ exampleEn: string; exampleKo: string }>>([{ exampleEn: '', exampleKo: '' }])
  const [showReview, setShowReview] = useState(false)
  const [reviewMode, setReviewMode] = useState<'once' | 'infinite'>('once')
  const [reviewQueue, setReviewQueue] = useState<Word[]>([])
  const [reviewDone, setReviewDone] = useState<Set<string>>(new Set())
  const [reviewTotal, setReviewTotal] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [formError, setFormError] = useState('')
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [customTopics, setCustomTopics] = useState<string[]>([])
  const [showTopicManage, setShowTopicManage] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [topicSaveError, setTopicSaveError] = useState('')
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topicTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const topicOptions = Array.from(new Set([...DEFAULT_TOPICS, ...customTopics]))
  const topicFilterList = ['all', ...topicOptions]

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!cancelled && data != null) {
          setCustomTopics(Array.isArray(data.customTopics) ? data.customTopics : [])
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const updateCustomTopics = useCallback(async (next: string[]): Promise<boolean> => {
    setTopicSaveError('')
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customTopics: next }),
        credentials: 'include',
      })
      const data = res.ok ? await res.json() : null
      if (res.ok && data != null && Array.isArray(data.customTopics)) {
        setCustomTopics(data.customTopics)
        return true
      }
      if (!res.ok) setTopicSaveError('저장에 실패했어요. 다시 시도해주세요.')
      return false
    } catch {
      setTopicSaveError('저장에 실패했어요. 다시 시도해주세요.')
      return false
    }
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 1) { setSuggestions([]); return }
    try {
      const res = await fetch(`/api/words/suggest?q=${encodeURIComponent(query)}`)
      const data: string[] = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleWordInput = (value: string) => {
    const normalized = /[\uAC00-\uD7A3]/.test(value) ? value : value.toLowerCase()
    setForm(f => ({ ...f, word: normalized }))
    value = normalized
    setShowSuggestions(true)
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    const isKorean = /[\uAC00-\uD7A3]/.test(value)
    suggestTimer.current = setTimeout(() => fetchSuggestions(value), isKorean ? 600 : 250)

    if (topicTimer.current) clearTimeout(topicTimer.current)
    if (value.trim().length >= 2) {
      topicTimer.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/words/ai-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: value.trim(), field: 'topic' }),
          })
          const data = await res.json()
          if (res.ok && data.value) setForm(f => ({ ...f, topic: data.value }))
        } catch { /* ignore */ }
      }, 1000)
    }
  }

  const selectSuggestion = (word: string) => {
    setForm(f => ({ ...f, word }))
    setSuggestions([])
    setShowSuggestions(false)
  }

  const filterByDate = useCallback((list: Word[]) => {
    const today = new Date().toISOString().slice(0, 10)
    let result = list
    if (dateView === 'today') {
      result = result.filter(w => w.createdAt.slice(0, 10) === today)
    } else if (dateView === 'range' && dateRange.from && dateRange.to) {
      result = result.filter(w => w.createdAt.slice(0, 10) >= dateRange.from && w.createdAt.slice(0, 10) <= dateRange.to)
    }
    if (selectedDifficulty !== 'all') {
      const tierMap: Record<string, number[]> = { '하': [1, 2], '중': [3], '상': [4], '최상': [5, 6] }
      const levels = tierMap[selectedDifficulty] ?? []
      result = result.filter(w => levels.includes(w.difficulty))
    }
    return result
  }, [dateView, dateRange, selectedDifficulty])

  const fetchWords = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedTopic !== 'all') params.set('topic', selectedTopic)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/words?${params}`, { credentials: 'include' })
      const data = await res.json().catch(() => [])
      const filtered = filterByDate(Array.isArray(data) ? data : [])
      setWords(filtered)
    } catch {
      setWords([])
    } finally {
      setLoading(false)
    }
  }, [selectedTopic, search, filterByDate])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setDuplicateId(null)
    setAiLoading(true)
    setShowSuggestions(false)

    // 입력한 단어가 사전에 없으면 1순위 추천으로 교체
    let finalWord = form.word.trim()
    try {
      const [exactRes, sugRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(finalWord)}&max=1`),
        fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(finalWord)}&max=1`),
      ])
      const exact: { word: string }[] = await exactRes.json()
      const sug: { word: string }[] = await sugRes.json()
      const isExactMatch = exact.length > 0 && exact[0].word.toLowerCase() === finalWord.toLowerCase()
      if (!isExactMatch && sug.length > 0) {
        finalWord = sug[0].word
      }
    } catch { /* 네트워크 오류 시 그대로 사용 */ }

    try {
      const filledExamples = examples.filter(e => e.exampleEn?.trim())
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: finalWord,
          translation: form.translation?.trim() ?? '',
          topic: form.topic || 'General',
          exampleEn: filledExamples[0]?.exampleEn ?? '',
          exampleKo: filledExamples[0]?.exampleKo ?? '',
          examples: filledExamples,
        }),
      })
      let data: Word | { error?: string; word?: { id: string } }
      try {
        data = await res.json()
      } catch {
        setFormError('응답을 읽지 못했어요. 다시 시도해주세요.')
        return
      }

      if (!res.ok) {
        const err = data as { error?: string; word?: { id: string } }
        if (res.status === 409) {
          setFormError('이미 저장된 단어예요.')
          setDuplicateId(err.word?.id ?? null)
        } else {
          setFormError(err.error || '오류가 발생했어요.')
        }
        return
      }
      setDuplicateId(null)

      setWords(prev => [data as Word, ...prev])
      setForm({ word: '', translation: '', topic: 'General' })
      setExamples([{ exampleEn: '', exampleKo: '' }, { exampleEn: '', exampleKo: '' }])
      setShowAddModal(false)
      router.replace('/words')
    } catch {
      setFormError('오류가 발생했어요.')
    } finally {
      setAiLoading(false)
    }
  }

  const [aiFieldLoading, setAiFieldLoading] = useState<'translation' | 'examples' | null>(null)

  const autoTranslateExample = (index: number, text: string) => {
    if (exampleTimers.current[index]) clearTimeout(exampleTimers.current[index]!)
    if (!text.trim()) return
    exampleTimers.current[index] = setTimeout(async () => {
      try {
        const res = await fetch('/api/words/ai-field', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: text.trim(), field: 'translateExample' }),
        })
        const data = await res.json()
        if (res.ok && data.value) {
          setExamples(prev => prev.map((e, i) => i === index ? { ...e, exampleKo: data.value } : e))
        }
      } catch { /* ignore */ }
    }, 900)
  }

  const fetchAiField = async (field: 'translation' | 'examples') => {
    if (!form.word.trim()) return
    setAiFieldLoading(field)
    try {
      const res = await fetch('/api/words/ai-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: form.word.trim(), field, count: examples.length }),
      })
      const data = await res.json()
      if (!res.ok) return
      if (field === 'translation' && data.value) {
        const translationText = Array.isArray(data.meanings) && data.meanings.length > 0
          ? data.meanings.join(' / ')
          : data.value
        setForm(f => ({ ...f, translation: translationText }))
      } else if (field === 'examples' && Array.isArray(data.value)) {
        setExamples(prev => prev.map((_, i) => data.value[i] ?? { exampleEn: '', exampleKo: '' }))
      }
    } catch { /* ignore */ } finally {
      setAiFieldLoading(null)
    }
  }

  const handleOverwrite = async () => {
    if (!duplicateId) return
    setAiLoading(true)
    try {
      await fetch(`/api/words/${duplicateId}`, { method: 'DELETE' })
      setWords(prev => prev.filter(w => w.id !== duplicateId))
      setDuplicateId(null)
      setFormError('')
      // 삭제 후 바로 재저장
      const filledExamples = examples.filter(e => e.exampleEn?.trim())
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: form.word.trim(),
          translation: form.translation?.trim() ?? '',
          topic: form.topic || 'General',
          exampleEn: filledExamples[0]?.exampleEn ?? '',
          exampleKo: filledExamples[0]?.exampleKo ?? '',
          examples: filledExamples,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setWords(prev => [data, ...prev])
        setForm({ word: '', translation: '', topic: 'General' })
        setExamples([{ exampleEn: '', exampleKo: '' }, { exampleEn: '', exampleKo: '' }])
        setShowAddModal(false)
        router.replace('/words')
      }
    } catch {
      setFormError('오류가 발생했어요.')
    } finally {
      setAiLoading(false)
    }
  }

  const startReview = (mode: 'once' | 'infinite') => {
    const now = new Date()
    const due = words.filter(w => new Date(w.nextReview) <= now)
    const initial = (due.length > 0 ? due : [...words]).sort(() => Math.random() - 0.5)
    setReviewMode(mode)
    setReviewQueue(initial)
    setReviewDone(new Set())
    setReviewTotal(initial.length)
    setRevealed(false)
    setShowReview(true)
  }

  const handleReviewAnswer = async (quality: number) => {
    const word = reviewQueue[0]
    const sm2 = calcSM2(quality, word.repetitions, word.easeFactor, word.interval)
    await fetch(`/api/words/${word.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sm2),
    })
    setWords(prev => prev.map(w => w.id === word.id ? { ...w, ...sm2 } : w))

    setReviewQueue(prev => {
      const rest = prev.slice(1)
      if (reviewMode === 'once' || quality >= 3) {
        // once 모드: 항상 통과 / infinite 모드: quality >= 3만 통과
        setReviewDone(d => new Set(d).add(word.id))
        return rest
      } else {
        // infinite 모드 미통과 — 2칸 뒤로 삽입
        const insertAt = Math.min(2, rest.length)
        return [...rest.slice(0, insertAt), word, ...rest.slice(insertAt)]
      }
    })
    setRevealed(false)
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
    const payload = { ...editForm }
    const validExamples = editExamples.filter(ex => ex.exampleEn.trim() || ex.exampleKo.trim())
    payload.examples = JSON.stringify(validExamples.length > 0 ? validExamples : [])
    payload.exampleEn = validExamples[0]?.exampleEn ?? ''
    payload.exampleKo = validExamples[0]?.exampleKo ?? undefined
    const res = await fetch(`/api/words/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
            <h1 className="page-title">📖 단어장</h1>
            <p className="text-gray-500 text-sm">총 {words.length}개 단어</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startReview('once')}
              disabled={words.length === 0}
              className="btn-secondary flex items-center gap-1.5 disabled:opacity-40"
            >
              🧠 복습하기
            </button>
            <button
              onClick={() => startReview('infinite')}
              disabled={words.length === 0}
              className="btn-secondary flex items-center gap-1.5 disabled:opacity-40"
            >
              🔁 무한 복습
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5">
              <span>➕</span> 단어 추가
            </button>
          </div>
        </div>

        {/* Date View Tabs */}
        <div className="flex mb-4 border-b-2" style={{ borderColor: '#ff99c8' }}>
          {(['all', 'today', 'range'] as const).map((v, i) => {
            const tabColors = ['#a9def9', '#a9def9', '#a9def9']
            const active = dateView === v
            return (
              <button
                key={v}
                onClick={() => setDateView(v)}
                className="flex-1 py-2 text-sm transition-all"
                style={{
                  fontFamily: "'Gaegu', sans-serif",
                  fontWeight: active ? 700 : 400,
                  color: active ? '#1a1a1a' : '#aaa',
                  marginBottom: '-2px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? `3px solid ${tabColors[i]}` : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {v === 'all' ? '전체' : v === 'today' ? '오늘의 단어' : '기간 선택'}
              </button>
            )
          })}
        </div>

        {dateView === 'range' && (
          <div className="mb-4 px-4 py-3 space-y-3" style={{ background: '#fff', border: '2px solid #a9def9', borderLeft: '4px solid #ff99c8', borderRadius: '4px 8px 8px 4px', boxShadow: '2px 2px 0px #a9def9' }}>
            <div className="flex gap-2">
              {[
                { label: '1주', days: 7 },
                { label: '1달', days: 30 },
                { label: '1년', days: 365 },
              ].map(({ label, days }) => {
                const to = new Date().toISOString().slice(0, 10)
                const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
                const isActive = dateRange.from === from && dateRange.to === to
                return (
                  <button
                    key={label}
                    onClick={() => setDateRange({ from, to })}
                    className="flex-1 py-1.5 text-sm font-medium transition-all"
                    style={{
                      fontFamily: "'Gaegu', sans-serif",
                      borderRadius: '6px',
                      border: isActive ? '2px solid #1a1a1a' : '2px solid #a9def9',
                      background: isActive ? '#a9def9' : '#ffffff',
                      color: '#1a1a1a',
                      boxShadow: isActive ? '2px 2px 0px #a9def9' : 'none',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} className="text-sm outline-none flex-1" style={{ color: '#1a1a1a', borderBottom: '2px solid #ff99c8', background: 'transparent', padding: '4px 0' }} />
              <span className="text-sm" style={{ color: '#aaa' }}>~</span>
              <input type="date" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} className="text-sm outline-none flex-1" style={{ color: '#1a1a1a', borderBottom: '2px solid #ff99c8', background: 'transparent', padding: '4px 0' }} />
            </div>
          </div>
        )}

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
          {topicFilterList.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                borderRadius: '4px',
                border: selectedTopic === t ? '2px solid #1a1a1a' : '2px solid #ff99c8',
                background: selectedTopic === t ? '#ff99c8' : '#ffffff',
                color: '#1a1a1a',
                boxShadow: selectedTopic === t ? '2px 2px 0px #1a1a1a' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {t === 'all' ? '전체' : t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowTopicManage(p => !p)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              borderRadius: '4px',
              border: '2px solid #a9def9',
              background: showTopicManage ? '#a9def9' : '#ffffff',
              color: '#1a1a1a',
              whiteSpace: 'nowrap',
            }}
          >
            {showTopicManage ? '접기' : '카테고리 관리'}
          </button>
        </div>

        {showTopicManage && (
          <div className="mb-4 p-3 rounded-xl border-2 border-[#a9def9] bg-white/80 space-y-3">
            <p className="text-xs font-medium text-gray-600">추가한 카테고리 (제거 가능)</p>
            {topicSaveError && (
              <p className="text-xs text-red-600">{topicSaveError}</p>
            )}
            {customTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customTopics.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: '#fcf6bd', color: '#1a1a1a' }}
                  >
                    {t}
                    <button
                      type="button"
                      onClick={async () => {
                        const next = customTopics.filter(x => x !== t)
                        setCustomTopics(next)
                        const ok = await updateCustomTopics(next)
                        if (!ok) setCustomTopics(prev => [...prev, t])
                      }}
                      className="ml-0.5 hover:opacity-70"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">추가한 카테고리가 없어요.</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicName}
                onChange={e => { setNewTopicName(e.target.value); setTopicSaveError('') }}
                placeholder="새 카테고리 이름"
                className="input-field text-sm flex-1"
                onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const name = newTopicName.trim()
                    if (!name || topicOptions.includes(name)) return
                    const next = [...customTopics, name]
                    setCustomTopics(next)
                    setNewTopicName('')
                    const ok = await updateCustomTopics(next)
                    if (!ok) setCustomTopics(prev => prev.filter(x => x !== name))
                  }
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  const name = newTopicName.trim()
                  if (!name || topicOptions.includes(name)) return
                  const next = [...customTopics, name]
                  setCustomTopics(next)
                  setNewTopicName('')
                  const ok = await updateCustomTopics(next)
                  if (!ok) setCustomTopics(prev => prev.filter(x => x !== name))
                }}
                className="btn-primary text-sm py-1.5 px-3"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { label: '전체', value: 'all', bg: '#ffffff',  color: '#1a1a1a', border: '#ff99c8' },
            { label: '하',   value: '하',   bg: '#d0f4de', color: '#1a1a1a', border: '#d0f4de' },
            { label: '중',   value: '중',   bg: '#a9def9', color: '#1a1a1a', border: '#a9def9' },
            { label: '상',   value: '상',   bg: '#fcf6bd', color: '#1a1a1a', border: '#fcf6bd' },
            { label: '최상', value: '최상', bg: '#e4c1f9', color: '#1a1a1a', border: '#e4c1f9' },
          ].map(({ label, value, bg, color, border }) => {
            const active = selectedDifficulty === value
            return (
            <button
              key={value}
              onClick={() => setSelectedDifficulty(value)}
              className="flex-1 py-1.5 text-xs font-semibold transition-all"
              style={{
                borderRadius: '4px',
                border: `2px solid ${active ? color : border}`,
                background: bg,
                color,
                boxShadow: active ? `2px 2px 0px ${border}` : 'none',
                opacity: active ? 1 : 0.65,
              }}
            >
              {label}
            </button>
          )})}
        </div>

        {/* Word List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : words.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">아직 단어가 없어요</p>
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
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">예문 ({editExamples.length}/5)</p>
                      <div className="space-y-2">
                        {editExamples.map((ex, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold w-4 shrink-0" style={{ color: '#aaa' }}>{i + 1}</span>
                              <input
                                className="input-field text-sm flex-1"
                                value={ex.exampleEn}
                                onChange={e => setEditExamples(prev => prev.map((v, j) => j === i ? { ...v, exampleEn: e.target.value } : v))}
                                placeholder={`예문 ${i + 1} (영어)`}
                              />
                              {editExamples.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setEditExamples(prev => prev.filter((_, j) => j !== i))}
                                  className="text-sm transition-colors hover:text-[#ff99c8]" style={{ color: '#ccc' }}
                                >✕</button>
                              )}
                            </div>
                            <input
                              className="input-field text-sm ml-6 w-[calc(100%-1.5rem)]"
                              value={ex.exampleKo}
                              onChange={e => setEditExamples(prev => prev.map((v, j) => j === i ? { ...v, exampleKo: e.target.value } : v))}
                              placeholder={`예문 ${i + 1} (한국어)`}
                            />
                          </div>
                        ))}
                        {editExamples.length < 5 && (
                          <button
                            type="button"
                            onClick={() => setEditExamples(prev => [...prev, { exampleEn: '', exampleKo: '' }])}
                            className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: '#aaa' }}
                          >
                            + 예문 추가
                          </button>
                        )}
                      </div>
                    </div>
                    {/* 타입 선택 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">유형</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TYPE_OPTIONS.map(opt => {
                          const current = editForm.type ?? word.type
                          const badge = TYPE_BADGES[opt.value]
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setEditForm(p => ({ ...p, type: opt.value }))}
                              className="tag text-xs transition-all"
                              style={current === opt.value
                                ? { background: badge.bg, color: badge.color, outline: `2px solid ${badge.bg}` }
                                : { background: '#fcf6bd', color: '#888' }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {/* 카테고리(주제) */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">카테고리</p>
                      <select
                        value={editForm.topic ?? word.topic ?? 'General'}
                        onChange={e => setEditForm(p => ({ ...p, topic: e.target.value }))}
                        className="input-field text-sm w-full"
                      >
                        {topicOptions.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleEdit(word.id)} className="btn-primary text-sm py-1.5 px-3">저장</button>
                      <button onClick={() => setEditId(null)} className="btn-ghost text-sm py-1.5">취소</button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div
                      className="flex cursor-pointer"
                      onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                    >
                      {/* 좌: 영단어 영역 */}
                      <div className="flex-1 min-w-0 relative flex items-center justify-center py-4 pr-4">
                        {/* 좌상: 뱃지 (절대 위치) */}
                        <div className="absolute top-0 left-0 flex items-center gap-1">
                          {word.type && TYPE_BADGES[word.type] && (
                            <span className="tag text-xs" style={{ background: TYPE_BADGES[word.type].bg, color: TYPE_BADGES[word.type].color }}>
                              {TYPE_BADGES[word.type].label}
                            </span>
                          )}
                          {word.difficulty > 0 && (
                            <span className="tag text-xs" style={{ background: DIFFICULTY_COLORS[word.difficulty], color: '#1a1a1a' }}>
                              {DIFFICULTY_LABELS[word.difficulty]}
                            </span>
                          )}
                          {word.mastered && <span className="tag text-xs" style={{ background: '#d0f4de', color: '#1a1a1a' }}>✓</span>}
                        </div>
                        {/* 중앙: 영단어 */}
                        <button
                          type="button"
                          className={`font-bold text-2xl hover:text-[#a9def9] transition-colors text-center font-handwrite ${word.mastered ? 'line-through' : ''}`}
                          style={{ color: word.mastered ? '#aaa' : '#1a1a1a' }}
                          onClick={e => { e.stopPropagation(); speak(word.word) }}
                          title="발음 듣기"
                        >
                          {word.word}
                        </button>
                      </div>

                      {/* 세로 구분선 */}
                      <div className="w-px self-stretch mx-1 shrink-0" style={{ background: '#e4c1f9' }} />

                      {/* 우: 한글 의미 영역 */}
                      <div className="flex-1 min-w-0 relative flex items-center justify-center py-4 pl-4">
                        {/* 우상: 액션 버튼 (절대 위치) */}
                        <div
                          className="absolute top-0 right-0 flex items-center gap-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleMastered(word)}
                            title={word.mastered ? '학습 중으로 변경' : '암기 완료로 표시'}
                            className="p-0.5 rounded text-xs transition-colors"
                            style={{ color: word.mastered ? '#d0f4de' : '#ccc' }}
                          >✓</button>
                          <button
                            onClick={() => {
                              setEditId(word.id)
                              setEditForm({})
                              let list: Array<{ exampleEn: string; exampleKo: string }> = []
                              if (word.examples) {
                                try { list = JSON.parse(word.examples) } catch { /* ignore */ }
                              }
                              if (list.length === 0 && (word.exampleEn || word.exampleKo)) {
                                list = [{ exampleEn: word.exampleEn ?? '', exampleKo: word.exampleKo ?? '' }]
                              }
                              if (list.length === 0) list = [{ exampleEn: '', exampleKo: '' }]
                              setEditExamples(list)
                            }}
                            className="p-0.5 rounded text-xs transition-colors hover:text-[#a9def9]" style={{ color: '#ccc' }}
                          >✏️</button>
                          <button
                            onClick={() => handleDelete(word.id)}
                            className="p-0.5 rounded text-xs transition-colors hover:text-[#ff99c8]" style={{ color: '#ccc' }}
                          >🗑️</button>
                        </div>
                        {/* 중앙: 한글 뜻 1~2개 */}
                        <div className="flex flex-col items-center gap-1 text-center">
                          {(() => {
                            const list: string[] = []
                            if (word.meanings) {
                              try {
                                const parsed = JSON.parse(word.meanings)
                                if (Array.isArray(parsed)) list.push(...parsed.slice(0, 2))
                              } catch { /* ignore */ }
                            }
                            if (list.length === 0) list.push(word.translation)
                            return list.map((m, i) => (
                              <span key={i} className={`font-bold text-2xl leading-tight font-handwrite ${i === 1 ? 'text-xl' : ''}`} style={{ color: i === 1 ? '#aaa' : '#1a1a1a' }}>
                                {m}
                              </span>
                            ))
                          })()}
                        </div>
                      </div>
                    </div>

                    {expandedId === word.id && (
                      <div className="mt-3 pt-3 animate-fade-in" style={{ borderTop: '1.5px dashed #a9def9' }}>
                        {(() => {
                          let list: { exampleEn?: string; exampleKo?: string }[] = []
                          if (word.examples) {
                            try { list = JSON.parse(word.examples) } catch { /* ignore */ }
                          }
                          if (list.length === 0 && word.exampleEn) {
                            list = [{ exampleEn: word.exampleEn, exampleKo: word.exampleKo }]
                          }
                          return list.map((ex, i) => (
                            <div key={i} className="rounded p-3 mb-2" style={{ background: '#fcf6bd', border: '1.5px solid #a9def9', borderLeft: '3px solid #ff99c8' }}>
                              <button
                                type="button"
                                onClick={() => ex.exampleEn && speak(ex.exampleEn)}
                                className="text-sm italic hover:text-[#a9def9] transition-colors text-left w-full" style={{ color: '#1a1a1a' }}
                                title="예문 발음 듣기"
                              >
                                "{ex.exampleEn}"
                              </button>
                              {ex.exampleKo && (
                                <p className="text-xs mt-1" style={{ color: '#888' }}>→ {ex.exampleKo}</p>
                              )}
                            </div>
                          ))
                        })()}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="tag" style={{ background: '#fcf6bd', color: '#1a1a1a' }}>{word.topic || 'General'}</span>
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
          <div className="w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto" style={{ background: '#fff', borderRadius: '4px 16px 16px 4px', border: '2px solid #a9def9', borderLeft: '5px solid #ff99c8', boxShadow: '4px 4px 0px #ff99c8' }}>
            <h2 className="text-xl font-bold text-gray-800 mb-1">✨ 새 단어 추가</h2>
            <p className="text-sm text-gray-500 mb-5">번역·예문을 비우면 AI가 자동으로 채워줘요.</p>

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">단어 / 숙어 *</label>
                <input
                  value={form.word}
                  onChange={e => handleWordInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="input-field"
                  placeholder="예: serendipity, break a leg..."
                  autoComplete="off"
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white rounded-xl shadow-lg mt-1 overflow-hidden" style={{ border: '2px solid #a9def9' }}>
                    {suggestions.map((s, i) => (
                      <li
                        key={s}
                        onMouseDown={() => selectSuggestion(s)}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#fcf6bd] flex items-center gap-2 ${i === 0 ? 'font-semibold' : ''}`} style={{ color: '#1a1a1a' }}
                      >
                        {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#ff99c8', color: '#1a1a1a' }}>추천</span>}
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    한국어 번역 <span className="text-gray-400 font-normal">(AI 생성 가능)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchAiField('translation')}
                    disabled={!form.word.trim() || aiFieldLoading === 'translation'}
                    className="text-xs font-bold px-2 py-0.5 rounded-full transition-all disabled:opacity-40" style={{ background: '#a9def9', color: '#1a1a1a' }}
                  >
                    {aiFieldLoading === 'translation' ? '생성 중...' : '✨ AI로 생성'}
                  </button>
                </div>
                <input
                  value={form.translation}
                  onChange={e => setForm({ ...form, translation: e.target.value })}
                  className="input-field"
                  placeholder="비워두면 AI가 채워줘요"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    영어 예문 <span className="text-gray-400 font-normal">({examples.length}/5)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {examples.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setExamples(prev => [...prev, { exampleEn: '', exampleKo: '' }])}
                        className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: '#aaa' }}
                      >
                        + 추가
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchAiField('examples')}
                      disabled={!form.word.trim() || aiFieldLoading === 'examples'}
                      className="text-xs font-bold px-2 py-0.5 rounded-full transition-all disabled:opacity-40" style={{ background: '#a9def9', color: '#1a1a1a' }}
                    >
                      {aiFieldLoading === 'examples' ? '생성 중...' : '✨ AI로 생성'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {examples.map((ex, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-4 shrink-0" style={{ color: '#aaa' }}>{i + 1}</span>
                        <input
                          value={ex.exampleEn}
                          onChange={e => {
                            const val = e.target.value
                            setExamples(prev => prev.map((v, j) => j === i ? { ...v, exampleEn: val } : v))
                            autoTranslateExample(i, val)
                          }}
                          className="input-field text-sm flex-1"
                          placeholder={`예문 ${i + 1} (영어)`}
                        />
                        {examples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExamples(prev => prev.filter((_, j) => j !== i))}
                            className="text-sm transition-colors hover:text-[#ff99c8]" style={{ color: '#ccc' }}
                          >✕</button>
                        )}
                      </div>
                      {ex.exampleKo && (
                        <p className="text-xs pl-6" style={{ color: '#aaa' }}>→ {ex.exampleKo}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주제</label>
                <select
                  value={form.topic}
                  onChange={e => setForm({ ...form, topic: e.target.value })}
                  className="input-field"
                >
                  {topicOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="rounded-xl px-4 py-2 text-sm flex items-center justify-between gap-2" style={{ background: '#fcf6bd', color: '#1a1a1a', border: '2px solid #ff99c8' }}>
                  <span>{formError}</span>
                  {duplicateId && (
                    <button
                      type="button"
                      onClick={handleOverwrite}
                      className="shrink-0 text-xs font-semibold px-3 py-1 rounded-lg transition-colors" style={{ background: '#ff99c8', color: '#1a1a1a' }}
                    >
                      덮어쓰기
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={aiLoading} className="btn-primary flex-1">
                  {aiLoading ? '🤖 AI 생성 중...' : '저장'}
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
      {/* 복습 모달 */}
      {showReview && (() => {
        // 완료 화면
        if (reviewQueue.length === 0) return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 text-center" style={{ background: '#fff', borderRadius: '4px 16px 16px 4px', border: '2px solid #a9def9', borderLeft: '5px solid #ff99c8', boxShadow: '4px 4px 0px #ff99c8' }}>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-2">복습 완료!</h2>
              <p className="mb-1" style={{ color: '#888' }}>총 <span className="font-bold" style={{ color: '#1a1a1a' }}>{reviewTotal}개</span> 단어를 모두 복습했어요.</p>
              <p className="text-sm mb-6" style={{ color: '#aaa' }}>다음에 또 만나요~ 👋</p>
              <button onClick={() => setShowReview(false)} className="btn-primary w-full">닫기</button>
            </div>
          </div>
        )

        const word = reviewQueue[0]
        const doneCount = reviewDone.size
        const progress = doneCount / reviewTotal

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden" style={{ background: '#fff', borderRadius: '4px 16px 16px 4px', border: '2px solid #a9def9', borderLeft: '5px solid #ff99c8', boxShadow: '4px 4px 0px #ff99c8' }}>
              {/* 헤더 */}
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b" style={{ borderColor: '#fcf6bd' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#aaa' }}>{reviewMode === 'infinite' ? '🔁 무한 반복 복습' : '🧠 복습'}</p>
                  <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>
                    완료 <span style={{ color: '#1a1a1a' }}>{doneCount}</span> / {reviewTotal}
                    <span className="ml-2 font-normal text-xs" style={{ color: '#1a1a1a' }}>남은 카드 {reviewQueue.length}장</span>
                  </p>
                </div>
                <button onClick={() => setShowReview(false)} className="text-xl hover:opacity-70" style={{ color: '#aaa' }}>✕</button>
              </div>

              {/* 진행 바 */}
              <div className="h-1.5 flex" style={{ background: '#e4c1f9' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${progress * 100}%`, background: '#d0f4de' }} />
              </div>

              {/* 카드 */}
              <div className="px-6 py-8 text-center min-h-[260px] flex flex-col items-center justify-center gap-3">
                <div className="flex gap-1.5">
                  {word.type && TYPE_BADGES[word.type] && (
                    <span className="tag text-xs" style={{ background: TYPE_BADGES[word.type].bg, color: TYPE_BADGES[word.type].color }}>{TYPE_BADGES[word.type].label}</span>
                  )}
                  {word.difficulty > 0 && (
                    <span className="tag text-xs" style={{ background: DIFFICULTY_COLORS[word.difficulty], color: '#1a1a1a' }}>{DIFFICULTY_LABELS[word.difficulty]}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => speak(word.word)}
                  className="text-4xl font-extrabold hover:text-[#a9def9] transition-colors font-handwrite" style={{ color: '#1a1a1a' }}
                >
                  {word.word}
                </button>

                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="mt-4 px-8 py-3 font-semibold rounded-2xl transition-colors text-sm" style={{ background: '#fcf6bd', color: '#1a1a1a', border: '2px solid #a9def9' }}
                  >
                    의미 보기 👀
                  </button>
                ) : (
                  <div className="mt-2 space-y-2 w-full text-center animate-fade-in">
                    <p className="text-2xl font-bold font-handwrite" style={{ color: '#1a1a1a' }}>{word.translation}</p>
                    {word.exampleEn && (
                      <button
                        type="button"
                        onClick={() => speak(word.exampleEn)}
                        className="text-sm italic transition-colors hover:text-[#ff99c8]" style={{ color: '#888' }}
                      >
                        "{word.exampleEn}"
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 평가 버튼 */}
              {revealed && (
                <div className="px-6 pb-6 grid grid-cols-4 gap-2 animate-fade-in">
                  {[
                    { label: '다시', emoji: '😵', quality: 1, bg: '#ff99c8', hint: '큐 뒤로' },
                    { label: '어려움', emoji: '😅', quality: 2, bg: '#e4c1f9', hint: '큐 뒤로' },
                    { label: '알겠음', emoji: '🙂', quality: 4, bg: '#a9def9', hint: '통과' },
                    { label: '완벽!', emoji: '🎉', quality: 5, bg: '#d0f4de', hint: '통과' },
                  ].map(btn => (
                    <button
                      key={btn.quality}
                      onClick={() => handleReviewAnswer(btn.quality)}
                      className="flex flex-col items-center gap-1 py-3 rounded-2xl font-semibold text-xs transition-colors hover:opacity-80"
                      style={{ background: btn.bg, color: '#1a1a1a', border: '1.5px solid rgba(0,0,0,0.08)' }}
                    >
                      <span className="text-xl">{btn.emoji}</span>
                      {btn.label}
                      <span className="text-[10px] opacity-50">{btn.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}
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
