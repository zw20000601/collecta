import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import type { Category } from '../../types'
import { DEFAULT_CATEGORY_NAME, displayCategoryName, isDefaultCategoryName } from '../../constants/categories'

const EMPTY_FORM = { name: '', icon: '', sort_order: 100 }

function toFriendlyError(error: any) {
  const message = String(error?.message || '').toLowerCase()

  if (message.includes('row-level security') || message.includes('policy')) {
    return '权限不足：当前账号没有管理员写入权限，请先完成 Supabase 管理员授权。'
  }
  if (message.includes('duplicate') || message.includes('unique')) {
    return '分类名称已存在，请换一个名称。'
  }
  if (message.includes('0 rows') || message.includes('没有写入')) {
    return '操作未生效：数据库没有更新任何记录（通常是权限或目标记录不存在）。'
  }

  return `操作失败：${error?.message || '未知错误'}`
}

export default function AdminCategories() {
  const qc = useQueryClient()
  const { showToast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_categories')
        .select('*, resource_count:resources(count)')
        .order('sort_order', { ascending: true })

      if (error) throw error

      return (data || []).map((c: any) => ({
        ...c,
        resource_count: c.resource_count?.[0]?.count ?? 0,
      })) as Category[]
    },
  })

  const createMut = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const payload = {
        name: data.name.trim(),
        icon: data.icon.trim(),
        sort_order: Number(data.sort_order) || 100,
      }

      const { data: created, error } = await supabase
        .from('resource_categories')
        .insert([payload])
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!created) throw new Error('0 rows affected')
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categories'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
      ])
      showToast('分类已创建')
    },
    onError: (e: any) => showToast(toFriendlyError(e), 'error'),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: typeof EMPTY_FORM & { id: string }) => {
      const payload = {
        name: data.name.trim(),
        icon: data.icon.trim(),
        sort_order: Number(data.sort_order) || 100,
      }

      const { data: updated, error } = await supabase
        .from('resource_categories')
        .update(payload)
        .eq('id', id)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!updated) throw new Error('0 rows affected')
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categories'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
      ])
      showToast('分类已更新')
    },
    onError: (e: any) => showToast(toFriendlyError(e), 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const uncatCat = categories?.find(c => isDefaultCategoryName(c.name))

      if (uncatCat) {
        const { error: moveError } = await supabase
          .from('resources')
          .update({ category_id: uncatCat.id, category_name: displayCategoryName(uncatCat.name) })
          .eq('category_id', id)

        if (moveError) throw moveError
      }

      const { data: deleted, error } = await supabase
        .from('resource_categories')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!deleted) throw new Error('0 rows affected')
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categories'] }),
        qc.invalidateQueries({ queryKey: ['resources'] }),
      ])
      showToast('分类已删除')
    },
    onError: (e: any) => showToast(toFriendlyError(e), 'error'),
  })

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditTarget(c)
    setForm({
      name: isDefaultCategoryName(c.name) ? DEFAULT_CATEGORY_NAME : c.name,
      icon: c.icon || '',
      sort_order: c.sort_order,
    })
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast('分类名称为必填项', 'error')
      return
    }

    if (editTarget) {
      const noChange =
        form.name.trim() === displayCategoryName(editTarget.name) &&
        (form.icon || '') === (editTarget.icon || '') &&
        Number(form.sort_order) === Number(editTarget.sort_order)

      if (noChange) {
        showToast('未检测到修改内容', 'info')
        return
      }

      updateMut.mutate({ id: editTarget.id, ...form }, { onSuccess: () => setModalOpen(false) })
      return
    }

    createMut.mutate(form, { onSuccess: () => setModalOpen(false) })
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    if (isDefaultCategoryName(deleteTarget.name)) {
      showToast('不能删除默认分类', 'error')
      return
    }

    deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  const isEditingDefault = Boolean(editTarget && isDefaultCategoryName(editTarget.name))

  const ICON_OPTIONS = ['🛠️', '📚', '🎨', '💻', '💼', '🎮', '📷', '📰', '📦', '🌐', '🎵', '🏠', '🗿', '💡', '🚀']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">分类管理</h1>
        <Button onClick={openCreate}><Plus size={16} /> 新增分类</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">分类</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">图标</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">资源数</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">排序</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : categories?.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{displayCategoryName(c.name)}</td>
                <td className="px-4 py-3 text-xl">{c.icon || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.resource_count ?? 0}</td>
                <td className="px-4 py-3 text-gray-500">{c.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    {!isDefaultCategoryName(c.name) && (
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? '编辑分类' : '新增分类'} maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">分类名称 *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="如：工具、学习"
              disabled={isEditingDefault}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {isEditingDefault && (
              <p className="text-xs text-amber-600 mt-1">默认分类名称不可修改，避免影响资源归类逻辑。</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">图标</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-9 h-9 text-xl rounded-lg border-2 transition-colors ${
                    form.icon === icon ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="或输入自定义图标/URL"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">排序权重</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>
              {editTarget ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`确定要删除分类「${displayCategoryName(deleteTarget?.name)}」吗？该分类下的资源将移动到「${DEFAULT_CATEGORY_NAME}」。`}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
