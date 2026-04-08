import { useState } from 'react'
import { Search, Shield, ShieldOff, UserX, UserCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import type { Profile } from '../../types'

export default function AdminUsers() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ user: Profile; action: string } | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (search) query = query.ilike('email', `%${search}%`)
      if (roleFilter) query = query.eq('role', roleFilter)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Profile[]
    },
  })

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); showToast('操作成功') },
    onError: () => showToast('操作失败', 'error'),
  })

  const handleConfirm = () => {
    if (!confirmAction) return
    const { user, action } = confirmAction
    let updates: Partial<Profile> = {}

    if (action === 'makeAdmin') updates = { role: 'admin' }
    else if (action === 'removeAdmin') updates = { role: 'user' }
    else if (action === 'ban') updates = { status: 'banned' }
    else if (action === 'unban') updates = { status: 'active' }

    updateUser.mutate({ id: user.id, updates }, { onSuccess: () => setConfirmAction(null) })
  }

  const actionLabels: Record<string, string> = {
    makeAdmin: '设为管理员',
    removeAdmin: '撤销管理员',
    ban: '禁用账号',
    unban: '解封账号',
  }

  const actionMessages: Record<string, (u: Profile) => string> = {
    makeAdmin: (u) => `确定将「${u.email}」设为管理员吗？`,
    removeAdmin: (u) => `确定撤销「${u.email}」的管理员权限吗？`,
    ban: (u) => `确定禁用「${u.email}」的账号吗？`,
    unban: (u) => `确定解封「${u.email}」的账号吗？`,
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">用户管理</h1>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索邮箱..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">邮箱</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">角色</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">注册时间</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">状态</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : users?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无用户</td></tr>
            ) : users?.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-gray-800">{u.email}</span>
                  {u.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">你</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'admin' ? 'success' : 'default'}>
                    {u.role === 'admin' ? '管理员' : '普通用户'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === 'banned' ? 'error' : 'success'}>
                    {u.status === 'banned' ? '已禁用' : '正常'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUser?.id && (
                    <div className="flex gap-1 justify-end">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => setConfirmAction({ user: u, action: 'makeAdmin' })}
                          title="设为管理员"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          <Shield size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ user: u, action: 'removeAdmin' })}
                          title="撤销管理员"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                        >
                          <ShieldOff size={14} />
                        </button>
                      )}
                      {u.status !== 'banned' ? (
                        <button
                          onClick={() => setConfirmAction({ user: u, action: 'ban' })}
                          title="禁用账号"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ user: u, action: 'unban' })}
                          title="解封账号"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction ? actionLabels[confirmAction.action] : '确认'}
        message={confirmAction ? actionMessages[confirmAction.action]?.(confirmAction.user) ?? '' : ''}
        confirmText="确认"
        loading={updateUser.isPending}
      />
    </div>
  )
}
