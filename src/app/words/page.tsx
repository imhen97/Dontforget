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
  word:     { label: '단어',  bg: '#e4c1f9', color: 'var(--ink)' },
  phrase:   { label: '숙어',  bg: '#e4c1f9', color: 'var(--ink)' },
  slang:    { label: '슬랭',  bg: '#ff99c8', color: 'var(--ink)' },
  sentence: { label: '문장',  bg: '#e4c1f9', color: 'var(--ink)' },
}
const TYPE_OPTIONS = [
  { value: 'word',     label: '단어' },
  { value: 'phrase',   label: '숙어' },
  { value: 'slang',    label: '슬랭' },
  { value: 'sentence', label: '문장' },
]

const DEFAULT_TOPICS = ['Business', 'Academic', 'Daily Life', 'Travel', 'Technology', 'Nature', 'Emotions', 'Food', 'Health', 'General']
const TOPICS = ['all', ...DEFAULT_TOPICS]

function WordsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [rawWords, setRawWords] = useState<Word[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(searchParams.get('add') === '1')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [dateView, setDateView] = useState<'all' | 'today' | 'range'>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const [inputLang, setInputLang] = useState<'ko' | 'en'>('en')
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
      .then((data: any) => {
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
      const data: any = res.ok ? await res.json() : null
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
    const isKoreanText = /[\uAC00-\uD7A3]/.test(value)
    if (inputLang === 'ko' || isKoreanText) {
      setSuggestions([])
      setShowSuggestions(false)
    } else {
      setShowSuggestions(true)
      if (suggestTimer.current) clearTimeout(suggestTimer.current)
      suggestTimer.current = setTimeout(() => fetchSuggestions(value), 250)
    }

    if (topicTimer.current) clearTimeout(topicTimer.current)
    if (value.trim().length >= 2) {
      topicTimer.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/words/ai-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: value.trim(), field: 'topic' }),
          })
          const data: any = await res.json()
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

  // 날짜 필터를 클라이언트에서 즉시 적용
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    let result = rawWords
    if (dateView === 'today') {
      result = rawWords.filter(w => w.createdAt.slice(0, 10) === today)
    } else if (dateView === 'range' && dateRange.from && dateRange.to) {
      result = rawWords.filter(w => w.createdAt.slice(0, 10) >= dateRange.from && w.createdAt.slice(0, 10) <= dateRange.to)
    }
    setWords(result)
  }, [rawWords, dateView, dateRange])

  const fetchWords = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedTopic !== 'all') params.set('topic', selectedTopic)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/words?${params}`, { credentials: 'include' })
      const data: any = await res.json().catch(() => [])
      setRawWords(Array.isArray(data) ? data : [])
    } catch {
      setRawWords([])
    } finally {
      setLoading(false)
    }
  }, [selectedTopic, search])

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
      let data: any
      try {
        data = await res.json()
      } catch {
        setFormError('응답을 읽지 못했어요. 다시 시도해주세요.')
        return
      }

      if (!res.ok) {
        if (res.status === 409) {
          setFormError('이미 저장된 단어예요.')
          setDuplicateId(data.word?.id ?? null)
        } else {
          setFormError(data.error || '오류가 발생했어요.')
        }
        return
      }
      setDuplicateId(null)

      setRawWords(prev => [data as Word, ...prev])
      setForm({ word: '', translation: '', topic: 'General' })
      setExamples([{ exampleEn: '', exampleKo: '' }, { exampleEn: '', exampleKo: '' }])
      setInputLang('en')
      setShowAddModal(false)
      router.replace('/words')
    } catch {
      setFormError('오류가 발생했어요.')
    } finally {
      setAiLoading(false)
    }
  }

  const [aiFieldLoading, setAiFieldLoading] = useState<'translation' | 'examples' | null>(null)
  const [koToEnLoading, setKoToEnLoading] = useState(false)

  const isKoreanInput = /[\uAC00-\uD7A3]/.test(form.word)

  const convertKoToEn = async () => {
    if (!form.word.trim()) return
    setKoToEnLoading(true)
    try {
      const res = await fetch('/api/words/ai-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: form.word.trim(), field: 'koToEn' }),
      })
      const data: any = await res.json()
      if (res.ok && data.value) {
        const koreanOriginal = form.word.trim()
        setForm(f => ({
          ...f,
          word: data.value,
          translation: f.translation || koreanOriginal,
        }))
        setInputLang('en')
      }
    } catch { /* ignore */ } finally {
      setKoToEnLoading(false)
    }
  }

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
        const data: any = await res.json()
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
      const data: any = await res.json()
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
      setRawWords(prev => prev.filter(w => w.id !== duplicateId))
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
      const data: any = await res.json()
      if (res.ok) {
        setRawWords(prev => [data, ...prev])
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
    setRawWords(prev => prev.map(w => w.id === word.id ? { ...w, ...sm2 } : w))

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
    setRawWords(prev => prev.filter(w => w.id !== id))
  }

  const handleMastered = async (word: Word) => {
    const res = await fetch(`/api/words/${word.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mastered: !word.mastered }),
    })
    if (res.ok) {
      const updated: any = await res.json()
      setRawWords(prev => prev.map(w => w.id === word.id ? updated : w))
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
      const updated: any = await res.json()
      setRawWords(prev => prev.map(w => w.id === id ? updated : w))
      setEditId(null)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6 bg-[#f8f7ff]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
            단어장
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">총 {words.length}개의 단어</p>
            <button
              onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch('') }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-gray-200/50 shadow-sm hover:shadow-md transition-all text-sm"
              style={{ color: search ? '#9333ea' : '#9ca3af' }}
              title="검색"
            >
              🔍
            </button>
          </div>
          {showSearch && (
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="단어 검색..."
              className="input-field mt-3"
              autoFocus
            />
          )}
          {/* 복습 버튼 2개 */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => startReview('once')}
              disabled={words.length === 0}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
            >
              🧠 복습하기
            </button>
            <button
              onClick={() => startReview('infinite')}
              disabled={words.length === 0}
              className="bg-gradient-to-br from-pink-500 to-rose-600 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
            >
              🔁 무한 복습
            </button>
          </div>
          {/* 단어 추가 버튼 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            ➕ 단어 추가하기
          </button>
        </div>

        {/* Date View Tabs */}
        <div className="flex mb-4 border-b-2 border-gray-200">
          {(['all', 'today', 'range'] as const).map((v) => {
            const active = dateView === v
            return (
              <button
                key={v}
                onClick={() => setDateView(v)}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{
                  color: active ? '#9333ea' : '#9ca3af',
                  marginBottom: '-2px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '3px solid #9333ea' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {v === 'all' ? '전체' : v === 'today' ? '오늘의 단어' : '기간 선택'}
              </button>
            )
          })}
        </div>

        {dateView === 'range' && (
          <div className="mb-4 px-4 py-3 space-y-3 bg-white/70 rounded-2xl border border-gray-200/50 shadow-sm">
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
                    className="flex-1 py-1.5 text-sm font-semibold transition-all rounded-xl"
                    style={{
                      border: isActive ? '2px solid #9333ea' : '1.5px solid #e5e7eb',
                      background: isActive ? '#faf5ff' : '#ffffff',
                      color: isActive ? '#9333ea' : '#6b7280',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} className="text-sm outline-none flex-1 border-b border-purple-300 bg-transparent py-1" style={{ color: '#374151' }} />
              <span className="text-sm text-gray-400">~</span>
              <input type="date" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} className="text-sm outline-none flex-1 border-b border-purple-300 bg-transparent py-1" style={{ color: '#374151' }} />
            </div>
          </div>
        )}

        {/* Topic Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {topicFilterList.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 whitespace-nowrap ${
                selectedTopic === t
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                  : 'bg-white/70 text-gray-700 border border-gray-200/50 hover:border-purple-300'
              }`}
            >
              {t === 'all' ? '전체' : t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowTopicManage(p => !p)}
            className={`flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
              showTopicManage
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-white/70 text-gray-600 border border-gray-200/50'
            }`}
          >
            {showTopicManage ? '접기' : '카테고리 관리'}
          </button>
        </div>

        {showTopicManage && (
          <div className="mb-4 p-4 rounded-2xl border border-gray-200/50 bg-white/70 shadow-sm space-y-3">
            <p className="text-xs font-medium text-gray-600">추가한 카테고리 (제거 가능)</p>
            {topicSaveError && (
              <p className="text-xs text-red-600">{topicSaveError}</p>
            )}
            {customTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customTopics.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
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


        {/* Word List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : words.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <p className="text-gray-500 font-medium text-lg">아직 단어가 없어요</p>
            <p className="text-gray-400 text-sm mt-1">단어를 추가해보세요!</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
              첫 단어 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {words.map(word => (
              <div key={word.id} className="group bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md hover:shadow-xl transition-all duration-300">
                {editId === word.id ? (
                  // Edit mode
                  <div className="p-4 space-y-2">
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
                              <span className="text-xs font-bold w-4 shrink-0 text-gray-400">{i + 1}</span>
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
                                  className="text-sm text-gray-300 hover:text-pink-400 transition-colors"
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
                            className="text-xs font-semibold text-gray-400 hover:text-purple-500 transition-colors"
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
                                ? { background: '#faf5ff', color: '#9333ea', border: '1.5px solid #a78bfa' }
                                : { background: '#f9fafb', color: '#9ca3af', border: '1.5px solid #e5e7eb' }}
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
                      className="flex items-stretch cursor-pointer p-4"
                      onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                    >
                      {/* 좌: 영단어 + 한국어 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <button
                            type="button"
                            className={`text-2xl font-bold text-left hover:text-purple-500 transition-colors leading-tight ${word.mastered ? 'line-through text-gray-400' : 'text-gray-800'}`}
                            onClick={e => { e.stopPropagation(); speak(word.word) }}
                            title="발음 듣기"
                          >
                            {word.word}
                          </button>
                          {(word.type && TYPE_BADGES[word.type] && word.type !== 'word') || word.mastered ? (
                            <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                              {word.type && TYPE_BADGES[word.type] && word.type !== 'word' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                  {TYPE_BADGES[word.type].label}
                                </span>
                              )}
                              {word.mastered && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">암기완료</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                        <div className="pl-4 border-l-4 border-purple-400">
                          {(() => {
                            let meaning = word.translation
                            if (word.meanings) {
                              try {
                                const parsed = JSON.parse(word.meanings)
                                if (Array.isArray(parsed) && parsed.length > 0) meaning = parsed[0]
                              } catch { /* ignore */ }
                            }
                            return (
                              <span className="text-base text-gray-700 leading-snug">
                                {meaning}
                              </span>
                            )
                          })()}
                        </div>
                      </div>

                      {/* 우: 액션 버튼 */}
                      <div className="flex flex-col items-center gap-1 shrink-0 ml-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleMastered(word)}
                            title={word.mastered ? '학습 중으로 변경' : '암기 완료로 표시'}
                            className="p-1.5 rounded-xl hover:bg-purple-50 transition-colors"
                            style={{ color: word.mastered ? '#a78bfa' : '#d1d5db' }}
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
                            className="p-1.5 rounded-xl hover:bg-purple-50 transition-colors text-gray-400 hover:text-purple-500 text-sm"
                          >✏️</button>
                          <button
                            onClick={() => handleDelete(word.id)}
                            className="p-1.5 rounded-xl hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500 text-sm"
                          >🗑️</button>
                        </div>
                    </div>

                    {expandedId === word.id && (
                      <div className="px-4 pb-4 pt-2 animate-fade-in border-t border-gray-100">
                        {(() => {
                          let list: { exampleEn?: string; exampleKo?: string }[] = []
                          if (word.examples) {
                            try { list = JSON.parse(word.examples) } catch { /* ignore */ }
                          }
                          if (list.length === 0 && word.exampleEn) {
                            list = [{ exampleEn: word.exampleEn, exampleKo: word.exampleKo }]
                          }
                          return list.map((ex, i) => (
                            <div key={i} className="rounded-2xl p-3 mb-2 bg-purple-50/50 border-l-4 border-purple-400">
                              <button
                                type="button"
                                onClick={() => ex.exampleEn && speak(ex.exampleEn)}
                                className="text-sm italic hover:text-purple-500 transition-colors text-left w-full text-gray-600"
                                title="예문 발음 듣기"
                              >
                                "{ex.exampleEn}"
                              </button>
                              {ex.exampleKo && (
                                <p className="text-xs mt-1 text-gray-400">→ {ex.exampleKo}</p>
                              )}
                            </div>
                          ))
                        })()}
                        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 font-medium">{word.topic || 'General'}</span>
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl overflow-hidden bg-white">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <h2 className="text-xl font-bold text-white">✨ 새 단어 추가</h2>
              <p className="text-sm text-white/80 mt-0.5">번역·예문을 비우면 AI가 자동으로 채워줘요.</p>
            </div>
            <div className="p-6">

            {/* 입력 언어 토글 */}
            <div className="flex gap-1 mb-4 p-1 rounded-2xl bg-gray-100 w-fit">
              <button
                type="button"
                onClick={() => { setInputLang('en'); setForm(f => ({ ...f, word: '' })); setSuggestions([]) }}
                className="text-sm font-semibold px-4 py-1.5 rounded-xl transition-all"
                style={{
                  background: inputLang === 'en' ? 'white' : 'transparent',
                  color: inputLang === 'en' ? '#9333ea' : '#9ca3af',
                  boxShadow: inputLang === 'en' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >🇺🇸 영어로</button>
              <button
                type="button"
                onClick={() => { setInputLang('ko'); setForm(f => ({ ...f, word: '' })); setSuggestions([]) }}
                className="text-sm font-semibold px-4 py-1.5 rounded-xl transition-all"
                style={{
                  background: inputLang === 'ko' ? 'white' : 'transparent',
                  color: inputLang === 'ko' ? '#9333ea' : '#9ca3af',
                  boxShadow: inputLang === 'ko' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >🇰🇷 한국어로</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="relative">
                <input
                  value={form.word}
                  onChange={e => handleWordInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="input-field"
                  placeholder={inputLang === 'ko' ? '예: 행복, 도전하다, 감사하다...' : '예: serendipity, break a leg...'}
                  autoComplete="off"
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white rounded-2xl shadow-xl mt-1 overflow-hidden border border-gray-100">
                    {suggestions.map((s, i) => (
                      <li
                        key={s}
                        onMouseDown={() => selectSuggestion(s)}
                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-purple-50 flex items-center gap-2 transition-colors ${i === 0 ? 'font-semibold' : ''}`}
                        style={{ color: '#374151' }}
                      >
                        {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">추천</span>}
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {isKoreanInput && (
                <button
                  type="button"
                  onClick={convertKoToEn}
                  disabled={koToEnLoading}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 active:scale-[0.98]"
                >
                  {koToEnLoading ? '🤖 영어 단어 생성 중...' : '✨ AI로 영어 단어 생성하기'}
                </button>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    한국어 번역 <span className="text-gray-400 font-normal">(AI 생성 가능)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchAiField('translation')}
                    disabled={!form.word.trim() || aiFieldLoading === 'translation'}
                    className="text-xs font-semibold px-3 py-1 rounded-xl transition-all disabled:opacity-40 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
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
                      className="text-xs font-semibold px-3 py-1 rounded-xl transition-all disabled:opacity-40 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
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
                <div className="rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-2 bg-red-50 border border-red-100">
                  <span className="text-red-700">{formError}</span>
                  {duplicateId && (
                    <button
                      type="button"
                      onClick={handleOverwrite}
                      className="shrink-0 text-xs font-semibold px-3 py-1 rounded-xl transition-colors bg-gradient-to-r from-pink-500 to-rose-600 text-white"
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
                  onClick={() => { setShowAddModal(false); setInputLang('en'); router.replace('/words') }}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
      {/* 복습 모달 */}
      {showReview && (() => {
        // 완료 화면
        if (reviewQueue.length === 0) return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-8">
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-2xl font-bold text-white">복습 완료!</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-1">총 <span className="font-bold text-gray-800">{reviewTotal}개</span> 단어를 모두 복습했어요.</p>
                <p className="text-sm text-gray-400 mb-6">다음에 또 만나요~ 👋</p>
                <button onClick={() => setShowReview(false)} className="btn-primary w-full">닫기</button>
              </div>
            </div>
          </div>
        )

        const word = reviewQueue[0]
        const doneCount = reviewDone.size
        const progress = doneCount / reviewTotal

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white">
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/70">{reviewMode === 'infinite' ? '🔁 무한 반복 복습' : '🧠 복습'}</p>
                  <p className="text-sm font-bold text-white">
                    완료 {doneCount} / {reviewTotal}
                    <span className="ml-2 font-normal text-xs text-white/70">남은 카드 {reviewQueue.length}장</span>
                  </p>
                </div>
                <button onClick={() => setShowReview(false)} className="text-xl text-white/70 hover:text-white">✕</button>
              </div>

              {/* 진행 바 */}
              <div className="h-1.5 bg-gray-100">
                <div className="h-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${progress * 100}%` }} />
              </div>

              {/* 카드 */}
              <div className="px-6 py-8 text-center min-h-[260px] flex flex-col items-center justify-center gap-3">
                <div className="flex gap-1.5">
                  {word.type && TYPE_BADGES[word.type] && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                      {TYPE_BADGES[word.type].label}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => speak(word.word)}
                  className="text-4xl font-extrabold hover:text-purple-500 transition-colors text-gray-800"
                >
                  {word.word}
                </button>

                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="mt-4 px-8 py-3 font-semibold rounded-2xl transition-all text-sm bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
                  >
                    의미 보기 👀
                  </button>
                ) : (
                  <div className="mt-2 space-y-2 w-full text-center animate-fade-in">
                    <p className="text-2xl font-bold text-gray-800">{word.translation}</p>
                    {word.exampleEn && (
                      <button
                        type="button"
                        onClick={() => speak(word.exampleEn)}
                        className="text-sm italic text-gray-400 hover:text-purple-500 transition-colors"
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
                    { label: '다시', emoji: '😵', quality: 1, bg: 'from-red-400 to-rose-500', hint: '큐 뒤로' },
                    { label: '어려움', emoji: '😅', quality: 2, bg: 'from-orange-400 to-amber-500', hint: '큐 뒤로' },
                    { label: '알겠음', emoji: '🙂', quality: 4, bg: 'from-blue-400 to-cyan-500', hint: '통과' },
                    { label: '완벽!', emoji: '🎉', quality: 5, bg: 'from-green-400 to-emerald-500', hint: '통과' },
                  ].map(btn => (
                    <button
                      key={btn.quality}
                      onClick={() => handleReviewAnswer(btn.quality)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-2xl font-semibold text-xs transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${btn.bg} text-white shadow-md`}
                    >
                      <span className="text-xl">{btn.emoji}</span>
                      {btn.label}
                      <span className="text-[10px] opacity-70">{btn.hint}</span>
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
