package com.zooklabs.zook

import java.time.LocalDateTime

import com.zooklabs.LoadResource

case class Image(date: LocalDateTime, image: String, photographer: String) {
  def imageBytes: Array[Byte] = LoadResource.load("/Magnificent_Turtle.png")
}
