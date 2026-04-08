import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useResources } from '../hooks/useResources'
import { useFavoriteIds } from '../hooks/useFavorites'
import ResourceCard from '../components/resources/ResourceCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

export default function CategoryDetail() {
  const { categoryName } = useParams<{ categoryName: string }>()
  const decodedName = categoryName === 'all' ? undefined : decodeURIComponent(categoryName || '')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'favorites' | 'views'>('newest')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useResources({
    categoryName: decodedName,
    search,
    sort,
    page,
    pageSize: 12,
  })

  const { data: favIds } = useFavoriteIds()

  const totalPages = Math.ceil((data?.total ?? 0) / 12)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link to="/categories" className="hover:text-emerald-500 transition-colors">资源广场</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium">{categoryName === 'all' ? '全部资源' : decodedName}</span>
        {data && (
          <span className="ml-2 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-medium">
            {data.total}
          </span>
        )}
      </nav>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="搜索资源..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as any); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
          >
            <option value="newest">最新发布</option>
            <option value="favorites">最多收藏</option>
            <option value="views">最多浏览</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.resources.length ? (
        <EmptyState
          title="暂无资源"
          description="该分类下还没有资源，去留言板告诉我们你需要什么"
          action={
            <Link to="/messages">
              <Button variant="outline" size="sm">去留言板反馈</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.resources.map(r => (
              <ResourceCard key={r.id} resource={r} isFavorited={favIds?.has(r.id)} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
