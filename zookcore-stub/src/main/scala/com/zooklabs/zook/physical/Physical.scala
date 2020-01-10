package com.zooklabs.zook.physical

import com.zooklabs.zook.{Detail, Mod}

trait Physical[T] extends Detail[T] {
  override val category       = "Physical"
  override val volatile       = List(Mod.PHYSICAL_MOD)
  override val ownerUid: Null = null
}
