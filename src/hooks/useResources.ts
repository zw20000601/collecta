import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Resource } from '../types'
import { DEFAULT_CATEGORY_NAME, isDefaultCategoryName } from '../constants/categories'

interface ResourceFilters {
  categoryName?: string
  search?: string
  tags?: string[]
  sort?: 'newest' | 'favorites' | 'views'
  page?: number
  pageSize?: number
}

export function useResources(filters: ResourceFilters = {}) {
  const { categoryName, search, tags, sort = 'newest', page = 1, pageSize = 12 } = filters

  return useQuery({
    queryKey: ['resources', categoryName, search, tags, sort, page],
    queryFn: async () => {
      let query = supabase
        .from('resources')
        .select('*', { count: 'exact' })
        .eq('is_public', true)

      if (categoryName) {
        if (isDefaultCategoryName(categoryName)) {
          query = query.in('category_name', ['', 'uncategorized', '未分类', DEFAULT_CATEGORY_NAME])
        } else {
          query = query.eq('category_name', categoryName)
        }
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags)
      }

      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'favorites') {
        query = query.order('favorite_count', { ascending: false })
      } else if (sort === 'views') {
        query = query.order('view_count', { ascending: false })
      }

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      return { resources: (data || []) as Resource[], total: count ?? 0 }
    },
  })
}

export function useAdminResources(filters: { search?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'resources', filters],
    queryFn: async () => {
      let query = supabase.from('resources').select('*').order('created_at', { ascending: false })

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%`)
      }
      if (filters.category) {
        if (isDefaultCategoryName(filters.category)) {
          query = query.in('category_name', ['', 'uncategorized', '未分类', DEFAULT_CATEGORY_NAME])
        } else {
          query = query.eq('category_name', filters.category)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Resource[]
    },
  })
}

export function useCreateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (resource: Partial<Resource>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('resources').insert([{ ...resource, user_id: user?.id }]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['admin', 'resources'] })
    },
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Resource> & { id: string }) => {
      const { data, error } = await supabase.from('resources').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['admin', 'resources'] })
    },
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resources').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['admin', 'resources'] })
    },
  })
}
