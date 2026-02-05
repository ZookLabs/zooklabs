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
  updated_at: string
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
  owner_id: number | null
  zooks: unknown // jsonb
}

export interface UsersTable {
  id: Generated<number>
  username: string | null
  discord_id: string
  discord_username: string
  sign_up_at: string
  last_login_at: string
  is_admin: boolean
}

export interface UsersTestTable {
  id: Generated<number>
  username: string | null
  discord_id: string
  discord_username: string
  sign_up_at: string
  last_login_at: string
  is_admin: boolean
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
export interface DatabaseSchema {
  block_push: BlockPushTable
  high_jump: HighJumpTable
  hurdles: HurdlesTable
  lap: LapTable
  leagues_metadata: LeaguesMetadataTable
  overall_league: OverallLeagueTable
  sprint: SprintTable
  tournament: TournamentTable
  users: UsersTable
  users_test: UsersTestTable
  zook: ZookTable
}
