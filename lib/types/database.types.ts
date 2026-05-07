export type SessionStatus = 'collecting_ideas' | 'voting' | 'completed'
export type IdeaCategory = 'activity' | 'restaurant' | 'event' | 'accommodation' | 'transport' | 'other'

export interface Session {
  id: string
  created_by: string | null
  title: string
  description: string | null
  status: SessionStatus
  invite_code: string
  destination: string | null
  date_start: string | null
  date_end: string | null
  idea_deadline: string | null
  voting_deadline: string | null
  created_at: string
  updated_at: string
}

export interface SessionMember {
  id: string
  session_id: string
  user_id: string
  display_name: string
  is_host: boolean
  joined_at: string
}

export interface Idea {
  id: string
  session_id: string
  submitted_by: string | null
  title: string
  description: string | null
  category: IdeaCategory
  url: string | null
  estimated_cost: string | null
  created_at: string
}

export interface Vote {
  id: string
  idea_id: string
  session_id: string
  user_id: string
  value: 1 | 2 | 3
  created_at: string
}

export interface IdeaWithVotes extends Idea {
  votes: Vote[]
  vote_score: number
  submitter_name?: string
}

export interface SessionWithMembers extends Session {
  session_members: SessionMember[]
}

export interface SessionPreview {
  id: string
  title: string
  description: string | null
  status: SessionStatus
  destination: string | null
  date_start: string | null
  date_end: string | null
  member_count: number
  is_member: boolean
}
