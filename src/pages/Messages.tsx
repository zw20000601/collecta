import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Send, Search } from 'lucide-react'
import { useMessages, useVoteMessage, useCreateMessage, useCreateReply, useMessageReplies } from '../hooks/useMessages'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import type { Message } from '../types'

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'purple' | 'success' }> = {
  '待处理': { label: '待处理', variant: 'warning' },
  '开发中': { label: '开发中', variant: 'purple' },
  '已完成': { label: '已完成', variant: 'success' },
}

const CATEGORIES = ['全部', '资源需求', '功能建议', '问题反馈']

function MessageItem({ msg }: { msg: Message }) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const vote = useVoteMessage()
  const createReply = useCreateReply()
  const { data: replies } = useMessageReplies(expanded ? msg.id : '')

  const statusInfo = STATUS_MAP[msg.status] ?? { label: msg.status, variant: 'default' as any }

  const handleVote = () => {
    if (!user) { showToast('登录后才能投票', 'info'); navigate('/login'); return }
    vote.mutate({ messageId: msg.id, hasVoted: !!msg.has_voted }, {
      onError: () => showToast('投票失败', 'error'),
    })
  }

  const handleReply = () => {
    if (!replyText.trim()) return
    createReply.mutate({ messageId: msg.id, content: replyText.trim() }, {
      onSuccess: () => { setReplyText(''); showToast('回复成功') },
      onError: () => showToast('回复失败', 'error'),
    })
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}小时前`
    return `${Math.floor(hrs / 24)}天前`
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Vote */}
        <button
          onClick={handleVote}
          disabled={vote.isPending}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors shrink-0 ${
            msg.has_voted
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-500'
          }`}
        >
          <ThumbsUp size={16} />
          <span className="text-xs font-semibold">{msg.vote_count}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-800 text-sm leading-snug">
              {msg.title || msg.content?.slice(0, 40)}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {msg.category && (
                <Badge variant="info" size="sm">{msg.category}</Badge>
              )}
              <Badge variant={statusInfo.variant} size="sm">{statusInfo.label}</Badge>
            </div>
          </div>

          {msg.content && msg.title && (
            <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{msg.content}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{timeAgo(msg.created_at)}</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              <MessageSquare size={12} />
              {msg.reply_count} 条回复
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          {replies?.map(reply => (
            <div key={reply.id} className={`mb-3 pl-3 border-l-2 ${reply.is_official ? 'border-emerald-400' : 'border-gray-200'}`}>
              {reply.is_official && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-2">官方</span>
              )}
              <span className="text-xs text-gray-600">{reply.content}</span>
              <span className="text-xs text-gray-400 ml-2">{timeAgo(reply.created_at)}</span>
            </div>
          ))}

          {user && (
            <div className="flex gap-2 mt-3">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="写下你的回复..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
                onKeyDown={e => e.key === 'Enter' && handleReply()}
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || createReply.isPending}
                className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Messages() {
  const [tab, setTab] = useState('全部')
  const [sort, setSort] = useState<'newest' | 'votes' | 'pending'>('newest')
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('资源需求')
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const loaderRef = useRef<HTMLDivElement>(null)

  const filters = {
    category: tab === '全部' ? undefined : tab,
    search: search || undefined,
    sort,
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(filters)
  const createMessage = useCreateMessage()

  const allMessages = data?.pages.flatMap(p => p.messages) ?? []

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handlePublish = () => {
    if (!user) { showToast('请先登录', 'info'); navigate('/login'); return }
    if (!title.trim() && !content.trim()) { showToast('请填写标题或详情', 'error'); return }

    const finalTitle = title.trim() || content.trim().slice(0, 20)
    const finalContent = content.trim() || title.trim()

    createMessage.mutate(
      { title: finalTitle, content: finalContent, category },
      {
        onSuccess: () => {
          setTitle(''); setContent('')
          showToast('发布成功')
        },
        onError: () => showToast('发布失败', 'error'),
      }
    )
  }

  const canPublish = !!(title.trim() || content.trim())

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={22} className="text-emerald-500" />
        <h1 className="text-2xl font-bold text-gray-800">留言板</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publish form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">发布留言</h2>
            <div className="flex flex-col gap-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="标题（选填）"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="详情（选填，与标题至少填一个）"
                rows={4}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 transition-all resize-none"
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white transition-all"
              >
                <option>资源需求</option>
                <option>功能建议</option>
                <option>问题反馈</option>
              </select>
              <Button
                onClick={handlePublish}
                disabled={!canPublish}
                loading={createMessage.isPending}
                className="w-full"
              >
                {user ? '发布留言' : '登录后发布'}
              </Button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setTab(c)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  tab === c ? 'bg-emerald-500 text-white font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索留言..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
            >
              <option value="newest">最新发布</option>
              <option value="votes">最多投票</option>
              <option value="pending">待处理</option>
            </select>
          </div>

          {/* Messages */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : allMessages.length === 0 ? (
            <EmptyState title="暂无留言" description="成为第一个发言的人吧" />
          ) : (
            <div className="flex flex-col gap-3">
              {allMessages.map(msg => <MessageItem key={msg.id} msg={msg} />)}

              {/* Load more */}
              <div ref={loaderRef} className="pt-4 text-center">
                {hasNextPage ? (
                  <Button variant="ghost" onClick={loadMore} loading={isFetchingNextPage}>
                    加载更多
                  </Button>
                ) : allMessages.length > 0 ? (
                  <p className="text-xs text-gray-400">已显示全部留言</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
