package zooklabs.endpoints.model.leagues

import java.time.LocalDateTime

import io.circe.Encoder
import zooklabs.model.LeagueTrial

final case class League(updatedAt: LocalDateTime, entries: List[LeagueTrial])

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
