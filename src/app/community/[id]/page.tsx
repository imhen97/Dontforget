'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; username: string }
}

interface PostDetail {
  id: string
  title: string
  content: string
  category: string
  user: { id: string; username: string }
  comments: Comment[]
  _count: { likes: number; comments: number }
  liked: boolean
  isMe: boolean
  createdAt: string
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/community/${params.id}`)
      .then(r => r.json() as Promise<PostDetail>)
      .then((data: any) => { setPost(data); setLoading(false) })
  }, [params.id])

  const handleLike = async () => {
    if (!post) return
    const res = await fetch(`/api/community/${post.id}/like`, { method: 'POST' })
    const data = await res.json() as { liked: boolean }
    setPost(p => p ? {
      ...p,
      liked: data.liked,
      _count: { ...p._count, likes: p._count.likes + (data.liked ? 1 : -1) }
    } : null)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !post) return
    setSubmitting(true)

    const res = await fetch(`/api/community/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentText }),
    })

    if (res.ok) {
      const comment = await res.json() as Comment
      setPost(p => p ? { ...p, comments: [...p.comments, comment] } : null)
      setCommentText('')
    }
    setSubmitting(false)
  }

  const handleDeletePost = async () => {
    if (!post || !confirm('이 게시글을 삭제할까요?')) return
    await fetch(`/api/community/${post.id}`, { method: 'DELETE' })
    router.push('/community')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce-light">💬</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">😅</div>
          <p className="text-gray-500">게시글을 찾을 수 없어요</p>
          <button onClick={() => router.push('/community')} className="btn-primary mt-4">돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-5 text-sm"
        >
          ← 뒤로
        </button>

        {/* Post */}
        <div className="card mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="tag text-xs mb-2" style={{ background: '#e4c1f9', color: '#1a1a1a' }}>{post.category}</span>
              <h1 className="text-xl font-bold text-gray-800 mt-1">{post.title}</h1>
            </div>
            {post.isMe && (
              <button onClick={handleDeletePost} className="text-gray-300 hover:text-red-400 p-1">
                🗑️
              </button>
            )}
          </div>

          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

          <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ color: '#888', borderColor: '#fcf6bd' }}>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">{post.user.username}</span>
              <span>·</span>
              <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>💬 {post._count.comments}</span>
              <button
                onClick={handleLike}
                className="flex items-center gap-1 transition-colors"
                style={{ color: post.liked ? '#ff99c8' : '#aaa' }}
              >
                <span>{post.liked ? '❤️' : '🤍'}</span>
                <span>{post._count.likes}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">
            댓글 {post.comments.length}개
          </h3>

          {post.comments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">첫 댓글을 남겨보세요! 💬</p>
          ) : (
            <div className="space-y-3">
              {post.comments.map(comment => (
                <div key={comment.id} className="rounded-xl p-3" style={{ background: '#fcf6bd' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">{comment.user.username}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment form */}
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            className="input-field flex-1"
            placeholder="댓글을 입력해주세요..."
          />
          <button type="submit" disabled={submitting || !commentText.trim()} className="btn-primary px-4">
            {submitting ? '...' : '전송'}
          </button>
        </form>
      </main>
    </div>
  )
}
