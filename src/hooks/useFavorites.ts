import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Favorite } from '../types'

export function useFavorites() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('favorites')
        .select('*, resource:resources(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Favorite[]
    },
    enabled: !!user,
  })
}

export function useFavoriteIds() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['favorite-ids', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>()
      const { data, error } = await supabase
        .from('favorites')
        .select('resource_id')
        .eq('user_id', user.id)
      if (error) throw error
      return new Set((data || []).map((f: any) => f.resource_id as string))
    },
    enabled: !!user,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ resourceId, isFav }: { resourceId: string; isFav: boolean }) => {
      if (!user) throw new Error('未登录')
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', resourceId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, resource_id: resourceId }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      qc.invalidateQueries({ queryKey: ['favorite-ids'] })
      qc.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}
