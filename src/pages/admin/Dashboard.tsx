import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, MessageSquare, Users, Clock, ChevronRight, AlertTriangle, X } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useAdminStats } from '../../hooks/useStats'
import { useAdminResources } from '../../hooks/useResources'
import { useAdminMessages } from '../../hooks/useMessages'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { displayCategoryName } from '../../constants/categories'

export default function Dashboard() {
  const [setupDismissed, setSetupDismissed] = useState(() => localStorage.getItem('admin_setup_dismissed') === '1')
  const dismissSetup = () => { localStorage.setItem('admin_setup_dismissed', '1'); setSetupDismissed(true) }

  const { data: stats } = useAdminStats()
  const { data: recentResources } = useAdminResources({})
  const { data: recentMessages } = useAdminMessages({})

  // Category distribution
  const { data: catData } = useQuery({
    queryKey: ['admin', 'category-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('resources')
        .select('category_name')
      if (!data) return []
      const counts: Record<string, number> = {}
      data.forEach((r: any) => {
        const category = displayCategoryName(r.category_name)
        counts[category] = (counts[category] || 0) + 1
      })
      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6)
    },
  })

  // Message status distribution
  const { data: msgStatusData } = useQuery({
    queryKey: ['admin', 'message-status'],
    queryFn: async () => {
      const { data } = await supabase.from('messages').select('status')
      if (!data) return []
      const counts: Record<string, number> = {}
      data.forEach((m: any) => { counts[m.status] = (counts[m.status] || 0) + 1 })
      return Object.entries(counts).map(([name, value]) => ({ name, value }))
    },
  })

  const PIE_COLORS = { '待处理': '#f59e0b', '开发中': '#8b5cf6', '已完成': '#10b981' }

  const statCards = [
    { label: '资源总数', value: stats?.resources ?? 0, icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50', link: '/admin/resources' },
    { label: '留言总数', value: stats?.messages ?? 0, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', link: '/admin/messages' },
    { label: '待处理留言', value: stats?.pendingMessages ?? 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', link: '/admin/messages' },
    { label: '注册用户', value: stats?.users ?? 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', link: '/admin/users' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">概览仪表盘</h1>

      {/* Admin setup guide */}
      {!setupDismissed && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-amber-800 mb-2">如果添加/编辑/删除时提示"权限不足"，请在 Supabase SQL Editor 执行以下完整 SQL（替换你的邮箱）：</p>
            <pre className="bg-amber-100 text-amber-900 px-3 py-2.5 rounded-lg text-xs font-mono mt-1 select-all whitespace-pre-wrap break-all leading-relaxed">{`-- 第一步：确保 profile 存在（若注册在建表之前需要此步骤）
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE email = '你的管理员邮箱'
ON CONFLICT (id) DO NOTHING;

-- 第二步：授予管理员权限
UPDATE public.profiles
SET role = 'admin'
WHERE email = '你的管理员邮箱';

-- 第三步：验证（应返回 role = admin）
SELECT id, email, role FROM public.profiles
WHERE email = '你的管理员邮箱';`}</pre>
            <p className="text-xs text-amber-600 mt-2">路径：Supabase 控制台 → 左侧 SQL Editor → New query → 粘贴后点击 Run。执行后刷新页面即可。</p>
          </div>
          <button onClick={dismissSetup} className="text-amber-400 hover:text-amber-600 shrink-0 mt-0.5 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <Link key={s.label} to={s.link} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{s.value}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar chart - category distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">资源分类分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData || []}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - message status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">留言状态分布</h3>
          {msgStatusData && msgStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={msgStatusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {msgStatusData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      {/* Recent lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent resources */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">最近添加资源</h3>
            <Link to="/admin/resources" className="text-xs text-emerald-500 hover:underline flex items-center gap-0.5">
              查看全部 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentResources?.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-700 truncate flex-1 pr-4">{r.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{displayCategoryName(r.category_name)}</span>
              </div>
            )) ?? <p className="text-sm text-gray-400">暂无资源</p>}
          </div>
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">最近留言</h3>
            <Link to="/admin/messages" className="text-xs text-emerald-500 hover:underline flex items-center gap-0.5">
              查看全部 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentMessages?.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-700 truncate flex-1 pr-4">{m.title || m.content?.slice(0, 30)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.status === '待处理' ? 'bg-amber-100 text-amber-600' :
                  m.status === '开发中' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                }`}>{m.status}</span>
              </div>
            )) ?? <p className="text-sm text-gray-400">暂无留言</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
