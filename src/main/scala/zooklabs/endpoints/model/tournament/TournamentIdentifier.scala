package zooklabs.endpoints.model.tournament

import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import io.circe.Encoder
import io.circe.refined.refinedEncoder

final case class TournamentIdentifier(
    id: NonNegInt,
    title: NonEmptyString
)

object TournamentIdentifier {
  implicit val encodeTournamentIdentifier: Encoder[TournamentIdentifier] =
    Encoder.forProduct2(
      "id",
      "name"
    )(u =>
      (
        u.id,
        u.title
      )
    )
}
