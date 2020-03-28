package zooklabs.model

import java.time.LocalDateTime

case class League(updatedAt: LocalDateTime, entries: List[Trial])
