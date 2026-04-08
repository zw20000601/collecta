import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/ui/Button'

export default function Login() {
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab as any)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, register, loginAsGuest, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (user) navigate(redirect, { replace: true })
  }, [user, navigate, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码')
      setLoading(false)
      return
    }

    if (tab === 'login') {
      const { error } = await login(email, password)
      if (error) {
        setError(error.message.includes('Invalid') ? '邮箱或密码错误' : error.message)
      } else {
        showToast('登录成功')
        navigate(redirect, { replace: true })
      }
    } else {
      if (password.length < 6) {
        setError('密码至少 6 位')
        setLoading(false)
        return
      }
      const { error } = await register(email, password)
      if (error) {
        setError(error.message.includes('already') ? '该邮箱已注册' : error.message)
      } else {
        showToast('注册成功，请查收验证邮件')
        setTab('login')
      }
    }

    setLoading(false)
  }

  const handleGuest = () => {
    loginAsGuest()
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="cloud-blob w-96 h-96 -top-20 -left-20 opacity-40" style={{ position: 'fixed' }} />
      <div className="cloud-blob w-64 h-64 bottom-20 right-10 opacity-30" style={{ position: 'fixed' }} />

      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-gray-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Collecta
          </Link>
          <p className="text-sm text-gray-500 mt-2">发现优质资源，一键收藏到你的库</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
              }`}
            >
              {t === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">邮箱</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">密码</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === 'register' ? '至少 6 位密码' : '请输入密码'}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
            {tab === 'login' ? '登录' : '注册账号'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button
            onClick={handleGuest}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            以游客身份浏览 →
          </button>
        </div>
      </div>
    </div>
  )
}
