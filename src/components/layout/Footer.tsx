import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

const footerLinks = {
  产品: [
    { label: '浏览器插件', href: '#' },
    { label: '移动应用', href: '#' },
    { label: '桌面客户端', href: '#' },
    { label: 'API', href: '#' },
  ],
  资源: [
    { label: '使用教程', href: '#' },
    { label: '帮助中心', href: '#' },
    { label: '更新日志', href: '#' },
    { label: '开发文档', href: '#' },
  ],
  关于: [
    { label: '团队', href: '#' },
    { label: '博客', href: '#' },
    { label: '联系我们', href: '#' },
    { label: '隐私政策', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </span>
              <span className="font-bold text-lg text-gray-800">Collecta</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
              你的个人资源宝库，收集、整理、发现，让每一条有价值的信息都触手可及。
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-semibold text-gray-700 text-sm mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 Collecta. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <Heart size={12} className="text-red-400 fill-red-400" /> for knowledge lovers
          </span>
        </div>
      </div>
    </footer>
  )
}
