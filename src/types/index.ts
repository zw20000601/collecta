export interface Resource {
  id: string
  user_id: string
  title: string
  slug: string
  description: string
  url: string
  category_id: string
  category_name: string
  tags: string[]
  note: string
  cover_url: string
  is_public: boolean
  favorite_count: number
  view_count: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  sort_order: number
  created_at: string
  resource_count?: number
}

export interface Message {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  status: string
  vote_count: number
  reply_count: number
  yesterday_vote_count: number
  priority_date: string
  created_at: string
  user_email?: string
  has_voted?: boolean
}

export interface MessageReply {
  id: string
  message_id: string
  user_id: string
  content: string
  is_official: boolean
  created_at: string
  user_email?: string
}

export interface Profile {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  resource_id: string
  created_at: string
  resource?: Resource
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string
  detail: string
  created_at: string
  admin_email?: string
}

export type ApprovalActionType =
  | 'delete_resource'
  | 'delete_message'
  | 'delete_message_reply'
  | 'delete_category'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface AdminApprovalRequest {
  id: string
  action_type: ApprovalActionType
  target_id: string
  target_label: string
  reason: string
  status: ApprovalStatus
  requested_by: string
  requested_by_email?: string
  reviewed_by?: string | null
  reviewed_by_email?: string | null
  review_note?: string | null
  created_at: string
  reviewed_at?: string | null
}

export interface UpdateLog {
  id: string
  version: string
  title: string
  content: string
  published_at: string
  is_public: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
