import { Clock3, Tag } from 'lucide-react'
import { usePublicUpdateLogs } from '../hooks/useChangelog'

export default function Changelog() {
  const { data: logs, isLoading } = usePublicUpdateLogs()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">更新日志</h1>
        <p className="text-sm text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">更新日志</h1>
        <p className="text-sm text-gray-500">这里会记录每次上线后的主要变更内容。</p>
      </div>

      <div className="space-y-4">
        {logs?.length ? (
          logs.map((item) => (
            <article key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <Tag size={12} /> {item.version}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Clock3 size={12} /> {item.published_at}
                </span>
              </div>

              <h2 className="text-base font-semibold text-gray-800 mb-2">{item.title}</h2>

              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                {item.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((change) => (
                    <li key={change}>{change}</li>
                  ))}
              </ul>
            </article>
          ))
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">暂无更新日志</div>
        )}
      </div>
    </div>
  )
}
