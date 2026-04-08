import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const [resourcesRes, usersRes, messagesRes] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact', head: true }).eq('is_public', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
      ])

      return {
        resources: resourcesRes.count ?? 0,
        users: usersRes.count ?? 0,
        messages: messagesRes.count ?? 0,
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [resources, messages, pendingMessages, users] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', '待处理'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])
      return {
        resources: resources.count ?? 0,
        messages: messages.count ?? 0,
        pendingMessages: pendingMessages.count ?? 0,
        users: users.count ?? 0,
      }
    },
  })
}
