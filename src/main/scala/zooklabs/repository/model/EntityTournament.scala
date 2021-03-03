package zooklabs.repository.model

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import zooklabs.endpoints.model.zooks.ZookIdentifier
import zooklabs.endpoints.model.zooks.ZookIdentifier._

case class EntityTournament(
    id: NonNegInt,
    title: NonEmptyString,
    description: String,
    ownerId: Option[Int],
    zooks: List[ZookIdentifier]
)
