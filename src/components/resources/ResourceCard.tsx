import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useToggleFavorite } from '../../hooks/useFavorites'
import type { Resource } from '../../types'
import { normalizeExternalUrl } from '../../utils/url'

interface ResourceCardProps {
  resource: Resource
  isFavorited?: boolean
}

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(normalizeExternalUrl(url)).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

function getDomain(url: string) {
  try { return new URL(normalizeExternalUrl(url)).hostname } catch { return url }
}

export default function ResourceCard({ resource, isFavorited = false }: ResourceCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const toggleFav = useToggleFavorite()
  const [coverBroken, setCoverBroken] = useState(false)

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      showToast('登录后才能收藏', 'info')
      navigate('/login')
      return
    }
    toggleFav.mutate(
      { resourceId: resource.id, isFav: isFavorited },
      {
        onSuccess: () => showToast(isFavorited ? '已取消收藏' : '收藏成功'),
        onError: () => showToast('操作失败，请重试', 'error'),
      }
    )
  }

  const handleClick = () => {
    const externalUrl = normalizeExternalUrl(resource.url)
    if (!externalUrl) {
      showToast('链接为空或格式不正确', 'error')
      return
    }

    const opened = window.open(externalUrl, '_blank', 'noopener,noreferrer')
    if (opened) return

    // Fallback for strict popup blockers
    const a = document.createElement('a')
    a.href = externalUrl
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const favicon = getFaviconUrl(resource.url)
  const domain = getDomain(resource.url)
  const displayTags = resource.tags?.slice(0, 3) ?? []
  const extraTags = (resource.tags?.length ?? 0) - 3
  const hasCover = Boolean(resource.cover_url?.trim()) && !coverBroken

  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald-100 transition-all duration-200 cursor-pointer group relative"
      onClick={handleClick}
    >
      {hasCover && (
        <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 bg-slate-900/95 p-1">
          <div className="w-full h-40 flex items-center justify-center">
            <img
              src={resource.cover_url}
              alt={resource.title}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
              onError={() => setCoverBroken(true)}
            />
          </div>
        </div>
      )}

      {/* Favicon + domain */}
      <div className="flex items-center gap-2 mb-3">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="w-4 h-4 rounded-sm"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-gray-200" />
        )}
        <span className="text-xs text-gray-400 truncate">{domain}</span>
        <ExternalLink size={12} className="text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2 leading-snug">
        {resource.title}
      </h3>

      {/* Description */}
      {resource.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {resource.description}
        </p>
      )}

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {displayTags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs">
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">+{extraTags}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Bookmark size={12} /> {resource.favorite_count ?? 0}
        </span>
        <button
          onClick={handleFav}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorited
              ? 'text-emerald-500 bg-emerald-50'
              : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
          }`}
          title={isFavorited ? '取消收藏' : '收藏'}
        >
          {isFavorited ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
    </div>
  )
}
