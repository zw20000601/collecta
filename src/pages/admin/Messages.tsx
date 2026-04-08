import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Send, Search } from 'lucide-react'
import {
  useAdminMessages,
  useUpdateMessageStatus,
  useDeleteMessage,
  useMessageReplies,
  useCreateReply,
} from '../../hooks/useMessages'
import { useCreateApprovalRequest } from '../../hooks/useApprovals'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import type { Message } from '../../types'

const STATUS_OPTIONS = ['待处理', '开发中', '已完成']
const STATUS_TABS = ['all', '待处理', '开发中', '已完成']

function MessageRow({ msg, isSuperAdmin }: { msg: Message; isSuperAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { showToast } = useToast()
  const updateStatus = useUpdateMessageStatus()
  const deleteMsg = useDeleteMessage()
  const createReply = useCreateReply()
  const createApproval = useCreateApprovalRequest()
  const { data: replies } = useMessageReplies(expanded ? msg.id : '')

  const qc = useQueryClient()
  const deleteReply = useMutation({
    mutationFn: async (replyId: string) => {
      const { error } = await supabase.from('message_replies').delete().eq('id', replyId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['message-replies', msg.id] })
      showToast('回复已删除')
    },
  })

  const handleStatusChange = (status: string) => {
    updateStatus.mutate(
      { id: msg.id, status },
      {
        onSuccess: () => showToast('状态已更新'),
        onError: () => showToast('更新失败', 'error'),
      }
    )
  }

  const handleOfficialReply = () => {
    if (!replyText.trim()) return
    createReply.mutate(
      { messageId: msg.id, content: replyText.trim(), isOfficial: true },
      {
        onSuccess: () => {
          setReplyText('')
          showToast('官方回复已发布')
        },
        onError: () => showToast('回复失败', 'error'),
      }
    )
  }

  const handleDeleteMessage = () => {
    if (!isSuperAdmin) {
      createApproval.mutate(
        {
          actionType: 'delete_message',
          targetId: msg.id,
          targetLabel: msg.title || msg.content?.slice(0, 40) || msg.id,
          reason: '普通管理员申请删除留言',
        },
        {
          onSuccess: () => {
            showToast('已提交删除审批，等待总管理员处理')
            setDeleteOpen(false)
          },
          onError: (e: any) => showToast(e?.message || '提交审批失败', 'error'),
        }
      )
      return
    }

    deleteMsg.mutate(msg.id, {
      onSuccess: () => {
        showToast('留言已删除')
        setDeleteOpen(false)
      },
      onError: () => showToast('删除失败', 'error'),
    })
  }

  const handleDeleteReply = (replyId: string, content: string) => {
    if (!isSuperAdmin) {
      createApproval.mutate(
        {
          actionType: 'delete_message_reply',
          targetId: replyId,
          targetLabel: content.slice(0, 40),
          reason: '普通管理员申请删除留言回复',
        },
        {
          onSuccess: () => showToast('已提交回复删除审批，等待总管理员处理'),
          onError: (e: any) => showToast(e?.message || '提交审批失败', 'error'),
        }
      )
      return
    }

    deleteReply.mutate(replyId)
  }

  const statusVariant = (s: string) => {
    if (s === '待处理') return 'warning'
    if (s === '开发中') return 'purple'
    return 'success'
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-gray-800 text-sm">{msg.title || msg.content?.slice(0, 40) || '无标题'}</span>
            {msg.category && <Badge variant="info" size="sm">{msg.category}</Badge>}
            <Badge variant={statusVariant(msg.status)} size="sm">{msg.status}</Badge>
            <span className="text-xs text-gray-400 ml-auto">👍 {msg.vote_count}</span>
          </div>

          {msg.content && msg.title && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{msg.content}</p>}

          <div className="flex items-center gap-4">
            <select
              value={msg.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-emerald-300"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-400 hover:text-emerald-500 flex items-center gap-1 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {msg.reply_count} 条回复
            </button>

            <button
              onClick={() => setDeleteOpen(true)}
              className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 ml-auto transition-colors"
            >
              <Trash2 size={12} /> 删除
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          {replies?.map((reply) => (
            <div key={reply.id} className={`mb-2 flex items-start gap-2 pl-3 border-l-2 ${reply.is_official ? 'border-emerald-400' : 'border-gray-200'}`}>
              <div className="flex-1">
                {reply.is_official && <span className="text-xs font-bold text-emerald-600 mr-1">官方</span>}
                <span className="text-xs text-gray-600">{reply.content}</span>
              </div>
              <button
                onClick={() => handleDeleteReply(reply.id, reply.content)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="发布官方回复..."
              className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-300 bg-emerald-50/30"
              onKeyDown={(e) => e.key === 'Enter' && handleOfficialReply()}
            />
            <button
              onClick={handleOfficialReply}
              disabled={!replyText.trim() || createReply.isPending}
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors text-xs flex items-center gap-1"
            >
              <Send size={12} /> 官方回复
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteMessage}
        message={
          isSuperAdmin
            ? '确定要删除该留言吗？'
            : '将提交删除审批，需总管理员同意后才会执行。'
        }
        loading={deleteMsg.isPending || createApproval.isPending}
      />
    </div>
  )
}

export default function AdminMessages() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const { isSuperAdmin } = useAuth()

  const { data: messages, isLoading } = useAdminMessages({
    status: tab === 'all' ? undefined : tab,
    search,
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">留言管理</h1>

      {!isSuperAdmin && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-2 text-sm">
          当前为普通管理员：删除留言/回复将进入审批，需总管理员确认。
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              tab === t ? 'bg-emerald-500 text-white font-medium' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}
          >
            {t === 'all' ? '全部' : t}
          </button>
        ))}

        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索留言..."
            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : messages?.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无留言</div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages?.map((m) => (
            <MessageRow key={m.id} msg={m} isSuperAdmin={isSuperAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
