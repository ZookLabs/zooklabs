package zooklabs

import cats.implicits._
import eu.timepit.refined.W
import eu.timepit.refined.api.{Refined, RefinedTypeOps}
import eu.timepit.refined.boolean.AllOf
import eu.timepit.refined.char.LetterOrDigit
import eu.timepit.refined.collection.{Forall, MaxSize, MinSize}
import shapeless.{::, HNil}
package object types {

  type UsernameType = AllOf[
    Forall[LetterOrDigit] ::
      MinSize[W.`3`.T] ::
      MaxSize[W.`20`.T] ::
      HNil
  ]

  type Username = String Refined UsernameType

  object Username extends RefinedTypeOps[Username, String]
}
