package zooklabs.repository.model

import java.time.LocalDateTime

import eu.timepit.refined.auto._
import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString

final case class ZookEntity(
    id: NonNegInt = 0,
    name: NonEmptyString,
    height: Double,
    length: Double,
    width: Double,
    weight: Double,
    components: Int,
    dateCreated: LocalDateTime,
    dateUploaded: LocalDateTime,
    owner: Option[Int]
)
