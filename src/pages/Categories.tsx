import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Grid3X3, Layers } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { SkeletonCard } from '../components/ui/Skeleton'
import { isDefaultCategoryName } from '../constants/categories'

const categoryIcons: Record<string, string> = {
  工具: '🛠️',
  学习: '📚',
  设计: '🎨',
  开发: '💻',
  商业: '💼',
  娱乐: '🎮',
  媒体: '📷',
  资讯: '📰',
  其他: '📦',
}

const CARD_DELAYS = [
  'animate-fade-up-1', 'animate-fade-up-2', 'animate-fade-up-3', 'animate-fade-up-4',
  'animate-fade-up-1', 'animate-fade-up-2', 'animate-fade-up-3', 'animate-fade-up-4',
]

export default function Categories() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const { data: categories, isLoading } = useCategories()

  const businessCategories = (categories || []).filter(c => !isDefaultCategoryName(c.name))

  const filtered = businessCategories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const allCount = (categories || []).reduce((sum, c) => sum + (c.resource_count ?? 0), 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Grid3X3 size={22} className="text-emerald-500" />
          资源广场
        </h1>
        <p className="text-sm text-gray-500">浏览所有公开资源，按分类快速查找</p>
      </div>

      <div className="relative max-w-md mb-8 animate-fade-up">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索分类..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <Link
            to="/categories/all"
            className="animate-fade-up-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1.5 hover:border-emerald-200 transition-all duration-200 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">🌐</div>
            <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">全部资源</h3>
            <p className="text-xs text-gray-400 mt-1">{allCount} 个资源</p>
          </Link>

          {filtered.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/categories/${encodeURIComponent(cat.name)}`}
              className={`${CARD_DELAYS[idx % 8]} bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1.5 hover:border-emerald-200 transition-all duration-200 group`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">
                {cat.icon && cat.icon.startsWith('http') ? (
                  <img src={cat.icon} alt="" className="w-8 h-8 object-contain" />
                ) : (
                  cat.icon || categoryIcons[cat.name] || '📁'
                )}
              </div>
              <h3 className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">{cat.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{cat.resource_count ?? 0} 个资源</p>
            </Link>
          ))}

          {!filtered.length && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Layers size={40} className="mx-auto mb-3 opacity-30" />
              <p>暂无分类</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
