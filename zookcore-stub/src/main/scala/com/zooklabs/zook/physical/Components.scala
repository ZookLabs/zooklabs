package com.zooklabs.zook.physical

import com.zooklabs.zook

case class Components(data: Int) extends Physical[Int] {
  override val tag = zook.Tag("Components")
}
