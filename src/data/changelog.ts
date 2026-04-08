export interface ChangelogItem {
  version: string
  date: string
  title: string
  changes: string[]
}

// 每次发布后在数组最前面追加一条即可
export const changelogItems: ChangelogItem[] = [
  {
    version: 'v1.3.0',
    date: '2026-04-08',
    title: '权限分级与审批流程上线',
    changes: [
      '新增总管理员与普通管理员分级权限。',
      '普通管理员删除资源/留言改为提交审批。',
      '总管理员可在审批中心同意并执行删除。',
      '修复留言回复计数显示不准确的问题。',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-04-08',
    title: '页脚联系我们升级',
    changes: [
      '新增“联系我们”弹窗，可展示微信二维码。',
      '支持配置微信号并一键复制。',
    ],
  },
]
