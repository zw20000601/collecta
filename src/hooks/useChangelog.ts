import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { UpdateLog } from '../types'
import { changelogItems } from '../data/changelog'

const TABLE_NAME = 'update_logs'

function isMissingTable(error: any) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('does not exist') || message.includes('not found')
}

function fallbackFromStatic(): UpdateLog[] {
  return changelogItems.map((item, idx) => ({
    id: `fallback-${idx}`,
    version: item.version,
    title: item.title,
    content: item.changes.join('\n'),
    published_at: item.date,
    is_public: true,
    sort_order: idx + 1,
    created_at: new Date(`${item.date}T00:00:00`).toISOString(),
    updated_at: new Date(`${item.date}T00:00:00`).toISOString(),
  }))
}

export function usePublicUpdateLogs() {
  return useQuery({
    queryKey: ['public', 'update-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('is_public', true)
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        if (isMissingTable(error)) return fallbackFromStatic()
        throw error
      }

      return (data || []) as UpdateLog[]
    },
  })
}

export function useAdminUpdateLogs() {
  return useQuery({
    queryKey: ['admin', 'update-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as UpdateLog[]
    },
  })
}

export function useCreateUpdateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<UpdateLog, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from(TABLE_NAME).insert([payload])
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'update-logs'] })
      qc.invalidateQueries({ queryKey: ['public', 'update-logs'] })
    },
  })
}

export function useUpdateUpdateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<UpdateLog> & { id: string }) => {
      const { error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'update-logs'] })
      qc.invalidateQueries({ queryKey: ['public', 'update-logs'] })
    },
  })
}

export function useDeleteUpdateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'update-logs'] })
      qc.invalidateQueries({ queryKey: ['public', 'update-logs'] })
    },
  })
}

