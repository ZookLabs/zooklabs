package zooklabs.enum

import cats.syntax.option._
import zooklabs.`enum`.SqlOrdering.{Ascending, Descending, SqlOrdering}

sealed trait Trials {
  val value: String
  val ordering: SqlOrdering
}

object Trials {
  case object Sprint    extends Trials {
    val value    = "sprint"
    val ordering = Descending
  }
  case object BlockPush extends Trials {
    val value    = "block_push"
    val ordering = Descending
  }
  case object Hurdles   extends Trials {
    val value    = "hurdles"
    val ordering = Descending
  }
  case object HighJump  extends Trials {
    val value    = "high_jump"
    val ordering = Descending
  }
  case object Lap       extends Trials {
    val value    = "lap"
    val ordering = Ascending
  }
  case object Overall   extends Trials {
    val value    = "overall_league"
    val ordering = Descending
  }

  val parse: String => Option[Trials] = {
    case "sprint"         => Sprint.some
    case "block_push"     => BlockPush.some
    case "hurdles"        => Hurdles.some
    case "high_jump"      => HighJump.some
    case "lap"            => Lap.some
    case "overall_league" => Overall.some
    case _                => none
  }

  val values = List(Sprint, BlockPush, Hurdles, HighJump, Lap, Overall)

  // Overall is not processed in the same way as the others
  val standardTrials = List(Sprint, BlockPush, Hurdles, HighJump, Lap)

}
