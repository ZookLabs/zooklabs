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

// export type LeagueTrial = 'sprint' | 'block_push' | 'hurdles' | 'high_jump' | 'lap' | 'overall_league';

export interface Leagues {
  sprint: number,
  block_push: number,
  hurdles: number,
  high_jump: number,
  lap: number,
  overall_league: number,
}
