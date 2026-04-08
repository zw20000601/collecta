import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = '确认操作', message, confirmText = '确认删除', loading
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  )
}
