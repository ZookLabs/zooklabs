package zooklabs.endpoints.model.zooks

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

import io.circe.Encoder
import zooklabs.endpoints.model.users.UserIdentifier

final case class ZookAbout(
    owner: Option[UserIdentifier],
    dateCreated: LocalDateTime,
    dateUploaded: LocalDateTime,
    downloads: Int,
    views: Int
)

object ZookAbout {

  private val dateTimeFormatter = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy")

  implicit val encodeZookAbout: Encoder[ZookAbout] =
    Encoder.forProduct5(
      "owner",
      "dateCreated",
      "dateUploaded",
      "downloads",
      "views"
    )(u =>
      (
        u.owner,
        u.dateCreated.format(dateTimeFormatter),
        u.dateUploaded.format(dateTimeFormatter),
        u.downloads,
        u.views
      )
    )
}
