package com.zooklabs

import java.time.LocalDateTime

import com.zooklabs.core.ZookError
import com.zooklabs.zook._
import com.zooklabs.zook.achievement.trial.ZookTrial
import com.zooklabs.zook.physical.{Components, ZookPhysical}

import scala.util.{Success, Try}

object ZookCore {

  def serialiseZook(zook: Zook): Try[Array[Byte]]           =
    Success(LoadResource.load("/Magnificent_Turtle.zook"))
  def parseZook(data: Array[Byte]): Either[ZookError, Zook] =
    Right(
      Zook(
        version = "2",
        passport = Passport(
          ownership = Seq(
            zook.Owner(
              adoptionDate = LocalDateTime.of(2006, 12, 28, 19, 8, 39),
              moniker = None,
              notes = "",
              uid = "A51A202B",
              username = "Anonymous::ZookOwner",
              zookname = "Magnificent_Turtle",
              creativeMod = Some(6.3),
              physicalMod = Some(6.3),
              cosmeticMod = Some(6.3),
              dynamicMod = Some(8.3)
            )
          ),
          achievement = Achievement(
            trial = zook.Trial(
              sprint = Some(
                ZookTrial(
                  112.6,
                  "A51A202B",
                  zook.Tag("Trial: Sprint", "cm/sec")
                )
              ),
              blockPush = Some(
                ZookTrial(
                  300.0,
                  "A51A202B",
                  zook.Tag("Trial: Block Push", "cm")
                )
              ),
              hurdles = Some(
                ZookTrial(
                  101.8,
                  "A51A202B",
                  zook.Tag("Trial: Hurdles", "cm/sec")
                )
              ),
              highJump = Some(
                ZookTrial(1.3, "A51A202B", zook.Tag("Trial: High Jump", "cm"))
              ),
              lap = Some(ZookTrial(9.5, "A51A202B", zook.Tag("Trial: Lap", "sec")))
            )
          ),
          physical = Physical(
            height = ZookPhysical(12.4, Tag("Height", "cm")),
            length = ZookPhysical(20.5, Tag("Length", "cm")),
            width = ZookPhysical(19.2, Tag("Width", "cm")),
            weight = ZookPhysical(4.531, Tag("Weight", "kg")),
            components = Components(16)
          )
        ),
        image = Image(
          date = LocalDateTime.of(2009, 9, 18, 22, 25, 35),
          image = "A VERY LONG STRING",
          photographer = "A51A202B"
        ),
        parameters = Parameters(),
        genome = Genome("")
      )
    )

}
