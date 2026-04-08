import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_categories')
        .select('*, resource_count:resources(count)')
        .order('sort_order', { ascending: true })

      if (error) throw error

      return (data || []).map((cat: any) => ({
        ...cat,
        resource_count: cat.resource_count?.[0]?.count ?? 0,
      })) as Category[]
    },
  })
}
