import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, isAdmin, logout, isGuest } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const canShowAdminEntry = Boolean(isAdmin)

  const navLinks = [
    { to: '/', label: '首页' },
    { to: '/categories', label: '资源广场' },
    { to: '/favorites', label: '收藏夹' },
    { to: '/messages', label: '留言板' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const closePasswordModal = () => {
    setPwdModalOpen(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  const handleOpenPassword = () => {
    setMenuOpen(false)
    setPwdModalOpen(true)
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('请填写完整的新密码', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('密码长度至少 6 位', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      showToast(`修改密码失败：${error.message}`, 'error')
      return
    }

    showToast('密码修改成功')
    closePasswordModal()
  }

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-800 hover:text-gray-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Collecta
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(link.to)
                    ? 'text-emerald-600 bg-emerald-50 font-medium'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User size={15} className="text-emerald-500" />
                  <span className="hidden sm:block whitespace-nowrap">{user.email}</span>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400">当前账号</p>
                        <p className="text-sm text-gray-700 break-all leading-5">{user.email}</p>
                      </div>

                      {canShowAdminEntry && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          管理后台
                        </Link>
                      )}

                      <button
                        onClick={handleOpenPassword}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <KeyRound size={14} /> 修改密码
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={14} /> 退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : isGuest ? (
              <Link
                to="/login"
                className="text-sm px-4 py-1.5 border border-emerald-400 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                登录
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/login?tab=register"
                  className="text-sm px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <Modal open={pwdModalOpen} onClose={closePasswordModal} title="修改密码" maxWidth="max-w-sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="outline" onClick={closePasswordModal}>取消</Button>
            <Button onClick={handleChangePassword} loading={savingPassword}>保存密码</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
