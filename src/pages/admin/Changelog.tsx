import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useAdminUpdateLogs,
  useCreateUpdateLog,
  useUpdateUpdateLog,
  useDeleteUpdateLog,
} from '../../hooks/useChangelog'
import { useToast } from '../../contexts/ToastContext'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import type { UpdateLog } from '../../types'

const EMPTY_FORM = {
  version: '',
  title: '',
  content: '',
  published_at: new Date().toISOString().slice(0, 10),
  is_public: true,
  sort_order: 100,
}

function normalizeError(error: any) {
  const message = String(error?.message || '').toLowerCase()
  if (message.includes('does not exist') || message.includes('not found')) {
    return '更新日志表不存在，请先执行 Supabase SQL 脚本。'
  }
  if (message.includes('row-level security') || message.includes('policy')) {
    return '权限不足：当前账号没有写入更新日志权限。'
  }
  return `操作失败：${error?.message || '未知错误'}`
}

export default function AdminChangelog() {
  const { showToast } = useToast()
  const { data: logs, isLoading, error } = useAdminUpdateLogs()

  const createMut = useCreateUpdateLog()
  const updateMut = useUpdateUpdateLog()
  const deleteMut = useDeleteUpdateLog()

  const [form, setForm] = useState(EMPTY_FORM)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UpdateLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UpdateLog | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(form.version.trim() && form.title.trim() && form.content.trim() && form.published_at)
  }, [form])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (log: UpdateLog) => {
    setEditTarget(log)
    setForm({
      version: log.version,
      title: log.title,
      content: log.content,
      published_at: log.published_at,
      is_public: log.is_public,
      sort_order: Number(log.sort_order) || 100,
    })
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!canSubmit) {
      showToast('请填写完整的版本、标题和更新内容', 'error')
      return
    }

    const payload = {
      version: form.version.trim(),
      title: form.title.trim(),
      content: form.content.trim(),
      published_at: form.published_at,
      is_public: form.is_public,
      sort_order: Number(form.sort_order) || 100,
    }

    if (editTarget) {
      updateMut.mutate(
        { id: editTarget.id, ...payload },
        {
          onSuccess: () => {
            showToast('更新日志已修改')
            setModalOpen(false)
          },
          onError: (e: any) => showToast(normalizeError(e), 'error'),
        }
      )
      return
    }

    createMut.mutate(payload, {
      onSuccess: () => {
        showToast('更新日志已发布')
        setModalOpen(false)
      },
      onError: (e: any) => showToast(normalizeError(e), 'error'),
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        showToast('更新日志已删除')
        setDeleteTarget(null)
      },
      onError: (e: any) => showToast(normalizeError(e), 'error'),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">更新日志管理</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> 新增日志
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          读取失败：{normalizeError(error)}（请先在 Supabase 执行 `supabase-update-logs.sql`）
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">版本</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">标题</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">日期</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">状态</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : !logs || logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无更新日志</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium">{log.version}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[360px] truncate" title={log.title}>{log.title}</td>
                <td className="px-4 py-3 text-gray-500">{log.published_at}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${log.is_public ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {log.is_public ? '已公开' : '隐藏'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(log)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(log)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? '编辑更新日志' : '新增更新日志'} maxWidth="max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">版本号 *</label>
              <input
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="例如：v1.4.0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">发布日期 *</label>
              <input
                type="date"
                value={form.published_at}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">排序</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 100 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="例如：权限分级与审批流程上线"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">更新内容 *（每行一条）</label>
            <textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder={'新增了 xx 功能\n优化了 xx 体验\n修复了 xx 问题'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
              className="w-4 h-4 accent-emerald-500"
            />
            公开显示到前台更新日志页面
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>保存</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`确定删除更新日志「${deleteTarget?.title || ''}」吗？`}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
