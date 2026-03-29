import type { Generated } from "kysely"

// Table types for each table in the database model

export interface BlockPushTable {
  zookid: Generated<number>
  name: string
  position: number
  score: number
  disqualified: boolean
}

export interface HighJumpTable {
  zookid: Generated<number>
  name: string
  position: number
  score: number
  disqualified: boolean
}

export interface HurdlesTable {
  zookid: Generated<number>
  name: string
  position: number
  score: number
  disqualified: boolean
}

export interface LapTable {
  zookid: Generated<number>
  name: string
  position: number
  score: number
  disqualified: boolean
}

export interface LeaguesMetadataTable {
  league: string
  updatedAt: Date
}

export interface OverallLeagueTable {
  zookid: number
  name: string
  position: number
  score: number
  disqualified: boolean
}

export interface SprintTable {
  zookid: Generated<number>
  name: string
  position: number
  score: number
  disqualified: boolean
}

export interface TournamentTable {
  id: number
  title: string
  description: string
  ownerId: number | null
  zooks: unknown // jsonb
}

export interface UsersTable {
  id: Generated<number>
  username: string | null
  discordId: string
  discordUsername: string
  signUpAt: Date
  lastLoginAt: Date
  isAdmin: boolean
}

export interface UsersTestTable {
  id: Generated<number>
  username: string | null
  discordId: string
  discordUsername: string
  signUpAt: string
  lastLoginAt: string
  isAdmin: boolean
}

export interface ZookTable {
  id: Generated<number>
  name: string
  height: number
  length: number
  width: number
  weight: number
  components: number
  datecreated: string
  dateuploaded: string
  owner: number | null
  downloads: number
  views: number
}

// Kysely DatabaseSchema mapping table names to table types
export interface TrialTables {
  block_push: BlockPushTable
  high_jump: HighJumpTable
  hurdles: HurdlesTable
  lap: LapTable
  sprint: SprintTable
  overall_league: OverallLeagueTable
}

export interface DatabaseSchema extends TrialTables {
  leagues_metadata: LeaguesMetadataTable
  tournament: TournamentTable
  users: UsersTable
  users_test: UsersTestTable
  zook: ZookTable
}
