import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { FileText } from 'lucide-react'
import type { AdminLog } from '../../types'

export default function AdminLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []) as AdminLog[]
    },
  })

  const formatDate = (d: string) => new Date(d).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">操作日志</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : !logs?.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FileText size={40} className="mb-3 opacity-30" />
            <p>暂无日志记录</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">操作人</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">操作类型</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">目标</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{log.admin_email || log.admin_id?.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell truncate max-w-xs">{log.detail || log.target_type}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
