import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Package, Tag, MessageSquare, Users, FileText,
  LogOut, ChevronRight, ExternalLink,
} from 'lucide-react'

const navItems = [
  { to: '/admin',            label: '概览',     icon: LayoutDashboard, end: true },
  { to: '/admin/resources',  label: '资源管理', icon: Package },
  { to: '/admin/categories', label: '分类管理', icon: Tag },
  { to: '/admin/messages',   label: '留言管理', icon: MessageSquare },
  { to: '/admin/users',      label: '用户管理', icon: Users },
  { to: '/admin/logs',       label: '操作日志', icon: FileText },
]

function getPageTitle(pathname: string) {
  const map: Record<string, string> = {
    '/admin':            '概览',
    '/admin/resources':  '资源管理',
    '/admin/categories': '分类管理',
    '/admin/messages':   '留言管理',
    '/admin/users':      '用户管理',
    '/admin/logs':       '操作日志',
  }
  return map[pathname] || '管理后台'
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar w-56 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-white text-lg">Collecta</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">管理后台</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
          {/* ← View Frontend button */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/15 transition-colors"
          >
            <ExternalLink size={16} />
            查看前台
          </Link>

          <div className="px-3 py-1.5 text-xs text-slate-500 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>管理后台</span>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">{getPageTitle(location.pathname)}</span>
          </div>
          {/* Quick link to frontend in topbar too */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
          >
            <ExternalLink size={13} />
            查看前台
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
