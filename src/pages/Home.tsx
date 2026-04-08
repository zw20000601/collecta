import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, RefreshCw, Cpu, Archive } from 'lucide-react'
import { useStats } from '../hooks/useStats'

const FEATURE_ITEMS = [
  {
    icon: <RefreshCw size={20} className="text-emerald-500" />,
    bg: 'bg-emerald-50',
    title: '实时同步',
    desc: '多端数据即时同步，随时随地访问收藏库',
    delay: 'animate-fade-up-1',
  },
  {
    icon: <Cpu size={20} className="text-violet-500" />,
    bg: 'bg-violet-50',
    title: '智能分类',
    desc: 'AI 自动识别内容标签，精准归类无需手动整理',
    delay: 'animate-fade-up-2',
  },
  {
    icon: <Search size={20} className="text-amber-500" />,
    bg: 'bg-amber-50',
    title: '快速检索',
    desc: '按标题、标签、分类秒级搜索，海量收藏也能定位',
    delay: 'animate-fade-up-3',
  },
  {
    icon: <Archive size={20} className="text-pink-500" />,
    bg: 'bg-pink-50',
    title: '收藏管理',
    desc: '一键收藏，批量整理，分享给好友收藏也能定位',
    delay: 'animate-fade-up-4',
  },
]

const FLOAT_TAGS = [
  { text: '实时同步', className: 'animate-float-slow', style: { top: '14%', left: '10%' } },
  { text: '智能分类', className: 'animate-float', style: { top: '14%', right: '10%' } },
  { text: '快速检索', className: 'animate-float-slow', style: { bottom: '14%', left: '10%' } },
  { text: '收藏管理', className: 'animate-float', style: { bottom: '14%', right: '10%' } },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { data: stats } = useStats()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/categories?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="relative overflow-hidden">
      <div className="cloud-blob animate-drift w-72 h-72 top-0 left-0 opacity-50" style={{ position: 'absolute' }} />
      <div className="cloud-blob animate-drift-slow w-56 h-56 top-0 right-0 opacity-35" style={{ position: 'absolute' }} />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 animate-fade-up">
            <h1 className="text-5xl font-bold text-gray-800 mb-2 leading-tight">发现优质资源，</h1>
            <h2
              className="text-4xl font-bold italic mb-5"
              style={{
                background: 'linear-gradient(135deg,#10b981,#0ea5e9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              一键收藏到你的库
            </h2>

            <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
              这里展示所有公开资源。你可以实时搜索、按分类筛选，也可以直接收藏并提交需求留言。
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索标题、标签、分类..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-amber-400 hover:bg-amber-500 active:scale-95 text-white rounded-xl font-medium transition-all shadow-sm"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          <div className="hidden lg:flex flex-1 justify-center">
            <div className="relative w-[430px] h-[320px]">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-drift-slow pointer-events-none"
                style={{
                  width: 210,
                  height: 210,
                  background: 'radial-gradient(circle,#c8f0e2 0%,#e0f7ef 55%,transparent 100%)',
                }}
              />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="animate-float bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center gap-3 p-4 w-[136px] h-[168px] relative">
                  <div className="w-7 h-7 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-500 font-bold text-lg leading-none">+</div>

                  <div className="w-full space-y-1.5">
                    <div className="h-2 bg-gray-200 rounded-full w-5/6 mx-auto" />
                    <div className="h-2 bg-gray-200 rounded-full w-4/6 mx-auto" />
                    <div className="h-2 bg-gray-200 rounded-full w-3/4 mx-auto" />
                  </div>

                  <div className="h-6 bg-amber-300 rounded-lg w-3/5" />

                  <div className="absolute -top-4 -right-4">
                    <div className="animate-float-delay w-9 h-9 bg-emerald-400 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xl leading-none">★</span>
                    </div>
                  </div>

                  <div className="absolute top-1/2 -right-10 -translate-y-1/2">
                    <div className="animate-float-slow w-7 h-7 border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-400 font-bold bg-white shadow-sm">−</div>
                  </div>
                </div>
              </div>

              {FLOAT_TAGS.map(tag => (
                <div
                  key={tag.text}
                  className={`${tag.className} absolute text-xs px-2.5 py-1 bg-white/95 border border-gray-100 rounded-lg shadow-sm text-gray-500 whitespace-nowrap`}
                  style={tag.style}
                >
                  {tag.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_ITEMS.map(item => (
            <div
              key={item.title}
              className={`${item.delay} bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-200 cursor-default group`}
            >
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl px-8 py-6" style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
          <div className="grid grid-cols-3 gap-4 divide-x divide-emerald-200">
            {[
              { label: '精选资源', sublabel: '公开资源总数', value: stats?.resources ?? 0 },
              { label: '活跃用户', sublabel: '注册用户总数', value: stats?.users ?? 0 },
              { label: '社区互动', sublabel: '留言总数', value: stats?.messages ?? 0 },
            ].map(s => (
              <div key={s.label} className="text-center px-4">
                <div className="text-xs font-medium text-emerald-700 bg-emerald-200/60 rounded-full px-3 py-0.5 inline-block mb-2">{s.label}</div>
                <div className="text-4xl font-bold text-gray-800 animate-count-glow">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white rounded-2xl px-8 py-7 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">还没找到想要的资源？</h3>
            <p className="text-sm text-gray-500">在留言板提交需求，社区会帮你找到</p>
          </div>
          <Link
            to="/messages"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-white rounded-xl font-medium transition-all shadow-sm whitespace-nowrap"
          >
            去留言板
          </Link>
        </div>
      </section>
    </div>
  )
}
