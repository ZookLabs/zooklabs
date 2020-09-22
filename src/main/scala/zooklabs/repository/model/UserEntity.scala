package zooklabs.repository.model

import java.time.LocalDateTime

import eu.timepit.refined.types.string.NonEmptyString
import zooklabs.types.Username

final case class UserEntity(
    id: Int = 0,
    username: Option[Username],
    discordId: NonEmptyString,
    discordUsername: NonEmptyString,
    signUpAt: LocalDateTime,
    lastLoginAt: LocalDateTime
)
