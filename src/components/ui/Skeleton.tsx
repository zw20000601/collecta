export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="skeleton h-4 w-3/4 mb-3" />
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-5/6 mb-4" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton h-4 w-1/5 ml-auto" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
