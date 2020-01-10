package com.zooklabs.zook.achievement

import com.zooklabs.zook.Detail

trait Achievement[T] extends Detail[T] {
  override val category = "Achievement"
}
