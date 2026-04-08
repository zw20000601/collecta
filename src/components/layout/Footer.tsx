import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Copy, Check } from 'lucide-react'
import Modal from '../ui/Modal'

const CONTACT_QR_DEFAULT = '/wechat-qr.png'
const CONTACT_QR_FALLBACK = '/wechat-qr-placeholder.svg'
const CONTACT_QR_URL = import.meta.env.VITE_CONTACT_WECHAT_QR || CONTACT_QR_DEFAULT
const CONTACT_WECHAT_ID = import.meta.env.VITE_CONTACT_WECHAT_ID || ''

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
    { label: '隐私政策', href: '#' },
  ],
}

export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false)
  const [qrSrc, setQrSrc] = useState(CONTACT_QR_URL)
  const [copied, setCopied] = useState(false)

  const openContact = () => {
    setQrSrc(CONTACT_QR_URL)
    setContactOpen(true)
  }

  const copyWechatId = async () => {
    if (!CONTACT_WECHAT_ID) return
    try {
      await navigator.clipboard.writeText(CONTACT_WECHAT_ID)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <>
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </span>
                <span className="font-bold text-lg text-gray-800">Collecta</span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed max-w-[220px]">
                你的个人资源库，收藏、整理、发现，让每一条有价值的信息都触手可及。
              </p>
            </div>

            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h4 className="font-semibold text-gray-700 text-sm mb-4">{group}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-gray-400 hover:text-emerald-500 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}

                  {group === '关于' && (
                    <li>
                      <button
                        type="button"
                        onClick={openContact}
                        className="text-sm text-gray-400 hover:text-emerald-500 transition-colors"
                      >
                        联系我们
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>© 2026 Collecta. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Made with <Heart size={12} className="text-red-400 fill-red-400" /> for knowledge lovers
            </span>
          </div>
        </div>
      </footer>

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="联系我们" maxWidth="max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-gray-500">微信扫码添加好友</p>
          <img
            src={qrSrc}
            alt="微信二维码"
            className="w-56 h-56 object-contain rounded-xl border border-gray-200 bg-gray-50"
            onError={() => setQrSrc(CONTACT_QR_FALLBACK)}
          />

          {CONTACT_WECHAT_ID ? (
            <div className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600 flex items-center justify-between gap-2">
              <span className="truncate">微信号：{CONTACT_WECHAT_ID}</span>
              <button
                type="button"
                onClick={copyWechatId}
                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-amber-600">提示：可在环境变量中配置 VITE_CONTACT_WECHAT_ID</p>
          )}

          <button
            type="button"
            onClick={() => setContactOpen(false)}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </Modal>
    </>
  )
}
