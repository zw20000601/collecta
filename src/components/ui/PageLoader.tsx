export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafb' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <span className="text-sm text-gray-400">加载中...</span>
      </div>
    </div>
  )
}
