package zooklabs.endpoints.model.tournament

import io.circe.Encoder
import zooklabs.endpoints.model.zooks.ZookIdentifier

final case class Tournament(
    identifier: TournamentIdentifier,
    about: TournamentAbout,
    zooks: List[ZookIdentifier]
)

object Tournament {

  implicit val encodeTournament: Encoder[Tournament] =
    Encoder.forProduct3(
      "identifier",
      "about",
      "zooks"
    )(u =>
      (
        u.identifier,
        u.about,
        u.zooks
      )
    )
}
