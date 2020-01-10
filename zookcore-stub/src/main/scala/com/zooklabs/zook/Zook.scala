package com.zooklabs.zook
case class Zook(version: String,
                passport: Passport,
                image: Image,
                parameters: Parameters,
                genome: Genome) {
  def name: String = passport.ownership.last.zookname
}
