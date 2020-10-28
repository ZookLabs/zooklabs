package com.zooklabs.zook

import java.time.LocalDateTime

case class Owner(
    adoptionDate: LocalDateTime,
    moniker: Option[String],
    notes: String,
    uid: String,
    username: String,
    zookname: String,
    creativeMod: Option[Double],
    physicalMod: Option[Double],
    cosmeticMod: Option[Double],
    dynamicMod: Option[Double]
)
