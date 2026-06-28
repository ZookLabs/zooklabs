// Shared API DTOs — the wire contract between the Deno API (apps/api) and the web
// client (apps/web). Single source of truth: the backend re-exports these from its
// own types.ts, and the future Nuxt front end imports them directly.

export interface ZookIdentifier {
  id: number
  name: string
}

export interface ZookTrial {
  score: number
  position: number
  disqualified: boolean
}

export interface ZookAbout {
  owner?: UserIdentifier
  dateCreated: string
  dateUploaded: string
  downloads: number
  views: number
}

export interface ZookPhysical {
  height: number
  length: number
  width: number
  weight: number
  components: number
}

export interface ZookAchievement {
  sprint?: ZookTrial
  blockPush?: ZookTrial
  hurdles?: ZookTrial
  highJump?: ZookTrial
  lap?: ZookTrial
  overall?: ZookTrial
}

export interface Zook {
  identifier: ZookIdentifier
  about: ZookAbout
  physical: ZookPhysical
  achievement: ZookAchievement
}

export const trial = [
  "sprint",
  "block_push",
  "hurdles",
  "high_jump",
  "lap",
  "overall_league",
]
export type Trial = typeof trial[number]

export interface Leagues {
  sprint: number | null
  block_push: number | null
  hurdles: number | null
  high_jump: number | null
  lap: number | null
  overall_league: number | null
}

export interface LeagueTrial {
  zookId: number
  name: string
  score: number
  position: number
}

export interface League {
  updatedAt: Date | string
  entries: LeagueTrial[]
}

export interface UserIdentifier {
  username: string // LetterOrDigit, 3 to 20 characters
}

export interface UserAbout {
  signUpAt: string
  lastLoginAt: string
}

export interface User {
  identifier: UserIdentifier
  about: UserAbout
  zooks: ZookIdentifier[]
}
