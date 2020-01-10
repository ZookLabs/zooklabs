package zooklabs.enum

import enumeratum.values.{StringEnum, StringEnumEntry}
import zooklabs.`enum`.SqlOrdering.{Ascending, Descending}

import scala.collection.immutable

sealed abstract class Trials(val value: String, val sqlOrdering: SqlOrdering)
    extends StringEnumEntry

case object Trials extends StringEnum[Trials] {

  case object Sprint    extends Trials("sprint", Descending)
  case object BlockPush extends Trials("block_push", Descending)
  case object Hurdles   extends Trials("hurdles", Descending)
  case object HighJump  extends Trials("high_jump", Descending)
  case object Lap       extends Trials("lap", Ascending)

  val values: immutable.IndexedSeq[Trials] = findValues
}
