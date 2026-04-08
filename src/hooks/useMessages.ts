import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Message, MessageReply } from '../types'

interface MessageFilters {
  category?: string
  search?: string
  sort?: 'newest' | 'votes' | 'pending'
}

export function useMessages(filters: MessageFilters = {}) {
  const { user } = useAuth()
  const PAGE_SIZE = 10

  return useInfiniteQuery({
    queryKey: ['messages', filters, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('messages')
        .select('*')

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }
      if (filters.sort === 'votes') {
        query = query.order('vote_count', { ascending: false })
      } else if (filters.sort === 'pending') {
        query = query.eq('status', '待处理').order('created_at', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      query = query.range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1)

      const { data, error } = await query
      if (error) throw error

      // Check if current user has voted
      let messages = (data || []) as Message[]
      if (user && messages.length > 0) {
        const ids = messages.map(m => m.id)
        const { data: votes } = await supabase
          .from('message_votes')
          .select('message_id')
          .eq('user_id', user.id)
          .in('message_id', ids)
        const votedSet = new Set((votes || []).map((v: any) => v.message_id))
        messages = messages.map(m => ({ ...m, has_voted: votedSet.has(m.id) }))
      }

      return { messages, nextPage: messages.length === PAGE_SIZE ? pageParam + 1 : undefined }
    },
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  })
}

export function useAdminMessages(filters: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'messages', filters],
    queryFn: async () => {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: false })
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Message[]
    },
  })
}

export function useMessageReplies(messageId: string) {
  return useQuery({
    queryKey: ['message-replies', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []) as MessageReply[]
    },
    enabled: !!messageId,
  })
}

export function useVoteMessage() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ messageId, hasVoted }: { messageId: string; hasVoted: boolean }) => {
      if (!user) throw new Error('未登录')
      if (hasVoted) {
        await supabase.from('message_votes').delete().eq('user_id', user.id).eq('message_id', messageId)
      } else {
        await supabase.from('message_votes').insert([{ user_id: user.id, message_id: messageId }])
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useCreateMessage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (msg: { title?: string; content?: string; category: string }) => {
      if (!user) throw new Error('未登录')
      const { error } = await supabase.from('messages').insert([{ ...msg, user_id: user.id }])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useCreateReply() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ messageId, content, isOfficial = false }: { messageId: string; content: string; isOfficial?: boolean }) => {
      if (!user) throw new Error('未登录')
      const { error } = await supabase.from('message_replies').insert([{
        message_id: messageId, content, user_id: user.id, is_official: isOfficial
      }])
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['message-replies', v.messageId] })
      qc.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useUpdateMessageStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('messages').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('messages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}
