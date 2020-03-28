package zooklabs.model

import java.time.LocalDateTime

import zooklabs.`enum`.Trials

case class LeagueMetadata(trial: Trials, updatedAt: LocalDateTime)
