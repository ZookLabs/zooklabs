package zooklabs

import java.sql.Timestamp
import java.time.LocalDateTime

import doobie.util

package object repository {
  implicit val localDateTimeMeta: util.Meta[LocalDateTime] =
    util.Meta[Timestamp].imap(_.toLocalDateTime)(Timestamp.valueOf)
}
