import { useState } from 'react'
import { Check, X, Clock } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useApprovalRequests, useReviewApprovalRequest } from '../../hooks/useApprovals'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import type { AdminApprovalRequest, ApprovalActionType, ApprovalStatus } from '../../types'

const STATUS_TABS: Array<{ key: ApprovalStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
]

const ACTION_LABELS: Record<ApprovalActionType, string> = {
  delete_resource: '删除资源',
  delete_message: '删除留言',
  delete_message_reply: '删除回复',
  delete_category: '删除分类',
}

function statusBadge(status: ApprovalStatus) {
  if (status === 'pending') return <Badge variant="warning">待审批</Badge>
  if (status === 'approved') return <Badge variant="success">已通过</Badge>
  return <Badge variant="error">已拒绝</Badge>
}

async function executeDeleteRequest(request: AdminApprovalRequest) {
  switch (request.action_type) {
    case 'delete_resource':
      return supabase.from('resources').delete().eq('id', request.target_id)
    case 'delete_message':
      return supabase.from('messages').delete().eq('id', request.target_id)
    case 'delete_message_reply':
      return supabase.from('message_replies').delete().eq('id', request.target_id)
    case 'delete_category':
      return supabase.from('resource_categories').delete().eq('id', request.target_id)
    default:
      throw new Error('不支持的审批操作类型')
  }
}

export default function AdminApprovals() {
  const [tab, setTab] = useState<ApprovalStatus | 'all'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { isSuperAdmin } = useAuth()
  const { showToast } = useToast()
  const { data: requests, isLoading } = useApprovalRequests(tab)
  const review = useReviewApprovalRequest()

  const approveMutation = useMutation({
    mutationFn: async (request: AdminApprovalRequest) => {
      const { error } = await executeDeleteRequest(request)
      if (error) throw error
      await review.mutateAsync({ id: request.id, status: 'approved' })
    },
  })

  const handleApprove = async (request: AdminApprovalRequest) => {
    if (!isSuperAdmin) {
      showToast('只有总管理员可以审批', 'error')
      return
    }

    try {
      setProcessingId(request.id)
      await approveMutation.mutateAsync(request)
      showToast('审批通过，删除已执行')
    } catch (error: any) {
      showToast(`审批失败：${error?.message || '未知错误'}`, 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (request: AdminApprovalRequest) => {
    if (!isSuperAdmin) {
      showToast('只有总管理员可以审批', 'error')
      return
    }

    try {
      setProcessingId(request.id)
      await review.mutateAsync({ id: request.id, status: 'rejected' })
      showToast('已拒绝该申请')
    } catch (error: any) {
      showToast(`拒绝失败：${error?.message || '未知错误'}`, 'error')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">审批中心</h1>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={14} />
          {isSuperAdmin ? '你是总管理员，可审批删除操作' : '你可查看自己提交的审批进度'}
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              tab === item.key
                ? 'bg-emerald-500 text-white font-medium'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">申请时间</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">申请人</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">操作</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">目标</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">状态</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">处理</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : !requests || requests.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无审批记录</td></tr>
            ) : requests.map((request) => (
              <tr key={request.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-500">{new Date(request.created_at).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3 text-gray-700">{request.requested_by_email || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{ACTION_LABELS[request.action_type]}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[260px] truncate" title={request.target_label || request.target_id}>
                  {request.target_label || request.target_id}
                </td>
                <td className="px-4 py-3">{statusBadge(request.status)}</td>
                <td className="px-4 py-3 text-right">
                  {isSuperAdmin && request.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(request)}
                        loading={processingId === request.id && review.isPending}
                      >
                        <X size={14} /> 拒绝
                      </Button>
                      <Button
                        onClick={() => handleApprove(request)}
                        loading={processingId === request.id && approveMutation.isPending}
                      >
                        <Check size={14} /> 同意并执行
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">{request.reviewed_by_email || '-'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

