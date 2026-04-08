import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Heart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import ResourceCard from '../components/resources/ResourceCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

const CARD_DELAYS = [
  'animate-fade-up-1',
  'animate-fade-up-2',
  'animate-fade-up-3',
  'animate-fade-up-4',
]

export default function Favorites() {
  const [search, setSearch] = useState('')
  const { data: favorites, isLoading } = useFavorites()

  const filtered =
    favorites?.filter(fav =>
      fav.resource?.title?.toLowerCase().includes(search.toLowerCase()) ||
      fav.resource?.description?.toLowerCase().includes(search.toLowerCase())
    ) ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6 animate-fade-up">
        <Heart size={22} className="text-emerald-500" />
        <h1 className="text-2xl font-bold text-gray-800">我的收藏夹</h1>
        {favorites && (
          <span className="bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-sm font-medium">
            {favorites.length}
          </span>
        )}
      </div>

      <div className="relative max-w-md mb-8 animate-fade-up">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="在收藏中搜索..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={CARD_DELAYS[i % CARD_DELAYS.length]}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="animate-fade-up">
          <EmptyState
            title={favorites?.length === 0 ? '收藏夹是空的' : '未找到匹配的收藏'}
            description={favorites?.length === 0 ? '去资源广场收藏你感兴趣的内容吧' : '换个关键词试试'}
            action={
              favorites?.length === 0 ? (
                <Link to="/categories">
                  <Button variant="primary" size="sm">去资源广场</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fav, idx) =>
            fav.resource ? (
              <div key={fav.id} className={CARD_DELAYS[idx % CARD_DELAYS.length]}>
                <ResourceCard resource={fav.resource} isFavorited={true} />
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
