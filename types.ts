export interface ZookContainer {
  zook: ZookEntity
  sprint?: ZookTrial
  blockPush?: ZookTrial
  hurdles?: ZookTrial
  highJump?: ZookTrial
  lap?: ZookTrial
}

export interface ZookIdentifier {
  id: number
  name: string
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

export interface UserIdentifier {
  username: string // Letter Or Digit, Min size 3, Max size 20
}

export interface ZookTrial {
  score: number
  position: number
  disqualified: boolean
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

export interface ZookAchievement {
  sprint?: ZookTrial
  blockPush?: ZookTrial
  hurdles?: ZookTrial
  highJump?: ZookTrial
  lap?: ZookTrial
  overall?: ZookTrial
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
  sprint: number
  block_push: number
  hurdles: number
  high_jump: number
  lap: number
  overall_league: number
}

export interface LeagueTrial {
  zookId: number
  name: string
  score: number
  position: number
}

export interface League {
  updatedAt: string
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

export interface UserEntity {
  id: number
  username?: string
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
