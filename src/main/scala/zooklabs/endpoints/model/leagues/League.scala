package zooklabs.endpoints.model.leagues

import java.time.LocalDateTime

import io.circe.Encoder
import zooklabs.repository.model.TrialEntity

final case class League(updatedAt: LocalDateTime, entries: List[TrialEntity])

object League {

  implicit val encodeLeague: Encoder[League] =
    Encoder.forProduct2(
      "updatedAt",
      "entries"
    )(u =>
      (
        u.updatedAt,
        u.entries
      )
    )
}
