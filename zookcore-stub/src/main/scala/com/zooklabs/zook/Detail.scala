package com.zooklabs.zook

trait Detail[T] {
  val volatile: List[Mod.Value]
  val category: String
  val data: T
  val ownerUid: String
  val tag: Tag
}

case class Tag(name: String, comment: String = "")
