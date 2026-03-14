'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface Post {
  id: string
  title: string
  content: string
  category: string
  author: string
  authorId: string
  commentCount: number
  likeCount: number
  liked: boolean
  isMe: boolean
  createdAt: string
}

const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '💬' },
  { id: 'study_tips', label: '공부법', emoji: '📚' },
  { id: 'word_debate', label: '단어 토론', emoji: '🤔' },
  { id: 'general', label: '자유', emoji: '🌟' },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' })
  const [postLoading, setPostLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/community?category=${category}`)
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
  }, [category])

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/community/${postId}/like`, { method: 'POST' })
    const data = await res.json()
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked: data.liked, likeCount: p.likeCount + (data.liked ? 1 : -1) }
        : p
    ))
  }

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('이 게시글을 삭제할까요?')) return
    await fetch(`/api/community/${postId}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    setPostLoading(true)
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      })
      if (res.ok) {
        const post = await res.json()
        setPosts(prev => [post, ...prev])
        setNewPost({ title: '', content: '', category: 'general' })
        setShowNewPost(false)
      }
    } finally {
      setPostLoading(false)
    }
  }

  const CATEGORY_COLORS: Record<string, string> = {
    study_tips: 'bg-blue-100 text-blue-600',
    word_debate: 'bg-yellow-100 text-yellow-700',
    general: 'bg-purple-100 text-purple-600',
  }

  const getCategoryLabel = (cat: string) => CATEGORIES.find(c => c.id === cat)?.label || cat

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">💬 커뮤니티</h1>
            <p className="text-gray-500 text-sm">영어 공부 이야기를 나눠요!</p>
          </div>
          <button onClick={() => setShowNewPost(true)} className="btn-primary flex items-center gap-1.5">
            <span>✏️</span> 글쓰기
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-600 border border-pink-200 hover:bg-pink-50'
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💭</div>
            <p className="text-gray-500">아직 게시글이 없어요</p>
            <button onClick={() => setShowNewPost(true)} className="btn-primary mt-4">
              첫 글 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <div className="card hover:bg-pink-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`tag text-xs ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1">{post.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                    {post.isMe && (
                      <button
                        onClick={(e) => handleDelete(post.id, e)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-sm flex-shrink-0 p-1"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">{post.author}</span>
                      <span>·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>💬 {post.commentCount}</span>
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center gap-1 transition-colors ${post.liked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
                      >
                        <span>{post.liked ? '❤️' : '🤍'}</span>
                        <span>{post.likeCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-5">✏️ 새 글 작성</h2>

            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewPost(p => ({ ...p, category: c.id }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        newPost.category === c.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
                <input
                  value={newPost.title}
                  onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  className="input-field"
                  placeholder="제목을 입력해주세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">내용</label>
                <textarea
                  value={newPost.content}
                  onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="내용을 입력해주세요..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={postLoading} className="btn-primary flex-1">
                  {postLoading ? '게시 중...' : '게시하기 🚀'}
                </button>
                <button type="button" onClick={() => setShowNewPost(false)} className="btn-secondary">
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
