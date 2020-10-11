package zooklabs.repository.model

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString

case class LeagueRanks(
    id: NonNegInt,
    name: NonEmptyString,
    sprintPosition: Int,
    blockPushPosition: Int,
    hurdlesPosition: Int,
    highJumpPosition: Int,
    lapPosition: Int
)
