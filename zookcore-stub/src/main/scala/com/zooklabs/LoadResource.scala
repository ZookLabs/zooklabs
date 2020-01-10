package com.zooklabs

object LoadResource {

  def load(name: String): Array[Byte] = {
    val resourceStream = getClass.getResourceAsStream(name)
    Stream
      .continually(resourceStream.read)
      .takeWhile(_ != -1)
      .map(_.toByte)
      .toArray
  }
}
