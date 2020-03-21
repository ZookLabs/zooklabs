package zooklabs.model

final case class Trial(zookId: Int, name: String, score: Double, position: Int = Int.MaxValue)
