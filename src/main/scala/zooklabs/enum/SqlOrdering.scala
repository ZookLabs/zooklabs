package zooklabs.`enum`

import enumeratum._

import scala.collection.immutable

sealed abstract class SqlOrdering(override val entryName: String) extends EnumEntry

object SqlOrdering extends Enum[SqlOrdering] {

  case object Ascending  extends SqlOrdering("ASC")
  case object Descending extends SqlOrdering("DESC")

  val values: immutable.IndexedSeq[SqlOrdering] = findValues
}
