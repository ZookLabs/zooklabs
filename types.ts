// Backend-only types live here.
// Shared API DTOs (the wire contract with the web client) come from @zooklabs/shared.
import type { ZookTrial } from "@zooklabs/shared"

export * from "@zooklabs/shared"

export interface ZookContainer {
  zook: ZookEntity
  sprint?: ZookTrial
  blockPush?: ZookTrial
  hurdles?: ZookTrial
  highJump?: ZookTrial
  lap?: ZookTrial
}

export interface ZookEntity {
  id: number
  name: string
  height: number
  length: number
  width: number
  weight: number
  components: number
  datecreated: Date
  dateuploaded: Date
  owner?: number
  downloads: number
  views: number
}

export interface TrialEntity {
  zookid: number // Non-negative integer
  name: string // Non-empty string
  score: number // Double
  position?: number // Defaults to 2147483647
  disqualified?: boolean // Defaults to false
}

// Default values can be handled when creating an instance of TrialEntity
export const createTrialEntity = (
  zookid: number,
  name: string,
  score: number,
  position: number = 2147483647,
  disqualified: boolean = false,
): TrialEntity => ({
  zookid,
  name,
  score,
  position,
  disqualified,
})

export interface UserEntity {
  id: number
  username: string | null
  discordId: string
  discordUsername: string
  signUpAt: Date
  lastLoginAt: Date
}

export interface AuthUser {
  id: number
  username?: string
  anonymous: boolean
}

export interface LeagueRanks {
  id: number
  name: string
  sprintPosition: number
  blockPushPosition: number
  hurdlesPosition: number
  highJumpPosition: number
  lapPosition: number
}

export interface LeagueCounts {
  sprint: number
  blockPush: number
  hurdles: number
  highJump: number
  lap: number
}

export interface LeagueRanksContainer {
  leagueRanks: LeagueRanks[]
  leagueCounts: LeagueCounts
}
