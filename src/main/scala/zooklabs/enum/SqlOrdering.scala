package zooklabs.`enum`

object SqlOrdering {
  sealed trait SqlOrdering {
    val sql: String
  }

  case object Ascending extends SqlOrdering {
    override val sql: String = "ASC"
  }
  case object Descending extends SqlOrdering {
    override val sql: String = "DESC"
  }

}
