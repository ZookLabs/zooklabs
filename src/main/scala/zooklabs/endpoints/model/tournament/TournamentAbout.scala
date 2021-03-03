package zooklabs.endpoints.model.tournament

import io.circe.Encoder

final case class TournamentAbout(
    description: String,
    ownerId: Option[Int]
)

object TournamentAbout {
  implicit val encodeTournamentAbout: Encoder[TournamentAbout] =
    Encoder.forProduct2(
      "description",
      "ownerId"
    )(u =>
      (
        u.description,
        u.ownerId
      )
    )
}
