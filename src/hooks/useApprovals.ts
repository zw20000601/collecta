import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { AdminApprovalRequest, ApprovalActionType, ApprovalStatus } from '../types'

const APPROVAL_TABLE = 'admin_approval_requests'

function isMissingApprovalTableError(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('does not exist') || message.includes('not found')
}

export function useApprovalRequests(status: ApprovalStatus | 'all' = 'all') {
  const { user, isAdmin, isSuperAdmin } = useAuth()

  return useQuery({
    queryKey: ['admin', 'approval-requests', status, user?.id, isSuperAdmin],
    queryFn: async () => {
      if (!user || !isAdmin) return []

      let query = supabase.from(APPROVAL_TABLE).select('*').order('created_at', { ascending: false })

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      if (!isSuperAdmin) {
        query = query.eq('requested_by', user.id)
      }

      const { data, error } = await query
      if (error) {
        if (isMissingApprovalTableError(error)) return []
        throw error
      }

      return (data || []) as AdminApprovalRequest[]
    },
    enabled: Boolean(user && isAdmin),
  })
}

export function useCreateApprovalRequest() {
  const qc = useQueryClient()
  const { user, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({
      actionType,
      targetId,
      targetLabel,
      reason = '',
    }: {
      actionType: ApprovalActionType
      targetId: string
      targetLabel: string
      reason?: string
    }) => {
      if (!user || !isAdmin) {
        throw new Error('当前账号无管理员权限，无法提交审批。')
      }

      const { data: existing } = await supabase
        .from(APPROVAL_TABLE)
        .select('id')
        .eq('action_type', actionType)
        .eq('target_id', targetId)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing?.id) {
        throw new Error('该操作已提交审批，请等待总管理员处理。')
      }

      const { error } = await supabase.from(APPROVAL_TABLE).insert([
        {
          action_type: actionType,
          target_id: targetId,
          target_label: targetLabel,
          reason,
          status: 'pending',
          requested_by: user.id,
          requested_by_email: user.email || null,
        },
      ])

      if (error) {
        if (isMissingApprovalTableError(error)) {
          throw new Error('审批表未创建，请先执行数据库审批 SQL。')
        }
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approval-requests'] })
    },
  })
}

export function useReviewApprovalRequest() {
  const qc = useQueryClient()
  const { user, isSuperAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote = '',
    }: {
      id: string
      status: Exclude<ApprovalStatus, 'pending'>
      reviewNote?: string
    }) => {
      if (!user || !isSuperAdmin) {
        throw new Error('只有总管理员可以审批。')
      }

      const { error } = await supabase
        .from(APPROVAL_TABLE)
        .update({
          status,
          review_note: reviewNote,
          reviewed_by: user.id,
          reviewed_by_email: user.email || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approval-requests'] })
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['admin', 'resources'] })
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['admin', 'messages'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
}

