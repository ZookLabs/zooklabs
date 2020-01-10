package com.zooklabs.zook.achievement.trial

import com.zooklabs.zook.achievement.Achievement
import com.zooklabs.zook.{Mod, Tag}

case class ZookTrial(data: Double, ownerUid: String, tag: Tag) extends Achievement[Double] {
  override val volatile = List(Mod.PHYSICAL_MOD, Mod.DYNAMIC_MOD)
}
