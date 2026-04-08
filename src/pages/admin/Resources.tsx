import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Globe, Image } from 'lucide-react'
import { useAdminResources, useCreateResource, useUpdateResource, useDeleteResource } from '../../hooks/useResources'
import { useCreateApprovalRequest } from '../../hooks/useApprovals'
import { useCategories } from '../../hooks/useCategories'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Badge from '../../components/ui/Badge'
import type { Resource } from '../../types'
import { DEFAULT_CATEGORY_NAME, displayCategoryName, isDefaultCategoryName } from '../../constants/categories'
import { normalizeExternalUrl } from '../../utils/url'

const COVER_BUCKET = import.meta.env.VITE_SUPABASE_COVER_BUCKET || 'resources'

const EMPTY_FORM = {
  title: '',
  description: '',
  url: '',
  category_id: '',
  category_name: DEFAULT_CATEGORY_NAME,
  tags: '',
  note: '',
  is_public: true,
  cover_url: '',
}

export default function AdminResources() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Resource | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)

  const { data: resources, isLoading } = useAdminResources({ search, category: catFilter })
  const { data: categories } = useCategories()
  const { showToast } = useToast()
  const { isSuperAdmin } = useAuth()

  const create = useCreateResource()
  const update = useUpdateResource()
  const remove = useDeleteResource()
  const createApproval = useCreateApprovalRequest()

  const defaultCategory = categories?.find((c) => isDefaultCategoryName(c.name))

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (r: Resource) => {
    setEditTarget(r)
    setForm({
      title: r.title,
      description: r.description || '',
      url: r.url,
      category_id: r.category_id || '',
      category_name: displayCategoryName(r.category_name),
      tags: r.tags?.join(', ') || '',
      note: r.note || '',
      is_public: r.is_public,
      cover_url: r.cover_url || '',
    })
    setModalOpen(true)
  }

  const handleCategoryChange = (catId: string) => {
    if (!catId) {
      setForm((f) => ({
        ...f,
        category_id: defaultCategory?.id || '',
        category_name: displayCategoryName(defaultCategory?.name || DEFAULT_CATEGORY_NAME),
      }))
      return
    }

    const cat = categories?.find((c) => c.id === catId)
    setForm((f) => ({ ...f, category_id: catId, category_name: displayCategoryName(cat?.name || DEFAULT_CATEGORY_NAME) }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showToast('图片大小不能超过 2MB', 'error')
      return
    }

    setUploading(true)

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })

    if (error) {
      const msg = String(error.message || '')
      const lower = msg.toLowerCase()

      if (lower.includes('bucket') && lower.includes('not found')) {
        showToast(`上传失败：未找到存储桶 "${COVER_BUCKET}"`, 'error')
      } else if (lower.includes('row-level security') || lower.includes('policy') || lower.includes('permission')) {
        showToast('上传失败：Storage 权限不足，请配置 storage.objects 上传策略', 'error')
      } else {
        showToast(`上传失败：${msg || '未知错误'}`, 'error')
      }

      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path)

    setForm((f) => ({ ...f, cover_url: publicUrl }))
    showToast('封面上传成功')
    setUploading(false)
  }

  const errMsg = (e: any) => {
    const message = String(e?.message || '').toLowerCase()
    if (message.includes('row-level security') || message.includes('policy')) {
      return '权限不足，请先完成管理员授权。'
    }
    return `操作失败：${e?.message || '未知错误'}`
  }

  const handleSubmit = () => {
    if (!form.title.trim() || !form.url.trim()) {
      showToast('标题和 URL 为必填项', 'error')
      return
    }

    const selectedCategory = categories?.find((c) => c.id === form.category_id) || defaultCategory

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      url: normalizeExternalUrl(form.url),
      category_id: selectedCategory?.id || undefined,
      category_name: displayCategoryName(selectedCategory?.name || form.category_name || DEFAULT_CATEGORY_NAME),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      note: form.note,
      is_public: form.is_public,
      cover_url: form.cover_url,
      slug: `${form.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`,
    }

    if (editTarget) {
      update.mutate(
        { id: editTarget.id, ...payload },
        {
          onSuccess: () => {
            showToast('更新成功')
            setModalOpen(false)
          },
          onError: (e: any) => showToast(errMsg(e), 'error'),
        }
      )
      return
    }

    create.mutate(payload, {
      onSuccess: () => {
        showToast('添加成功')
        setModalOpen(false)
      },
      onError: (e: any) => showToast(errMsg(e), 'error'),
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    if (!isSuperAdmin) {
      createApproval.mutate(
        {
          actionType: 'delete_resource',
          targetId: deleteTarget.id,
          targetLabel: deleteTarget.title,
          reason: '普通管理员申请删除资源',
        },
        {
          onSuccess: () => {
            showToast('已提交删除审批，等待总管理员处理')
            setDeleteTarget(null)
          },
          onError: (e: any) => showToast(errMsg(e), 'error'),
        }
      )
      return
    }

    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        showToast('已删除')
        setDeleteTarget(null)
      },
      onError: (e: any) => showToast(errMsg(e), 'error'),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">资源管理</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> 新增资源
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <option value="">全部分类</option>
          {categories?.map((c) => (
            <option key={c.id} value={displayCategoryName(c.name)}>
              {displayCategoryName(c.name)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">标题</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">分类</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">标签</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">状态</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">加载中...</td>
              </tr>
            ) : resources?.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">暂无资源</td>
              </tr>
            ) : (
              resources?.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-gray-400 shrink-0" />
                      <a
                        href={normalizeExternalUrl(r.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-800 hover:text-emerald-500 font-medium truncate max-w-[180px]"
                      >
                        {r.title}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{displayCategoryName(r.category_name)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {r.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.is_public ? 'success' : 'default'}>{r.is_public ? '公开' : '隐藏'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {isSuperAdmin && (
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? '编辑资源' : '新增资源'} maxWidth="max-w-xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">标题 *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">资源链接 *</label>
              <input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">描述</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">分类</label>
              <select
                value={form.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">{DEFAULT_CATEGORY_NAME}</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {displayCategoryName(c.name)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">标签（逗号分隔）</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="标签1, 标签2"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">封面图</label>
              <div className="flex gap-2 items-center mb-2">
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 transition-colors text-sm text-gray-500">
                  <Image size={14} />
                  {uploading ? '上传中...' : '上传图片'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                </label>
                {form.cover_url && <img src={form.cover_url} alt="" className="h-10 w-16 object-cover rounded-lg border border-gray-200" />}
              </div>
              <input
                value={form.cover_url}
                onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))}
                placeholder="或粘贴图片 URL（Storage 未配置时可先用此方式）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">备注</label>
              <input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-sm text-gray-700">公开显示</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} loading={create.isPending || update.isPending}>
              {editTarget ? '保存更改' : '添加资源'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={
          isSuperAdmin
            ? `确定要删除资源「${deleteTarget?.title}」吗？此操作不可恢复。`
            : `将为资源「${deleteTarget?.title}」提交删除审批，需总管理员同意后才会执行。`
        }
        loading={remove.isPending || createApproval.isPending}
      />
    </div>
  )
}
