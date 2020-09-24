package zooklabs.repository.model

import java.time.LocalDateTime

import zooklabs.`enum`.Trials

case class LeagueMetadataEntity(trial: Trials, updatedAt: LocalDateTime)
