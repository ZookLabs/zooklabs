package zooklabs.repository

import cats.effect.IO
import doobie.Transactor
import doobie.implicits._
import doobie.util.query.Query0
import zooklabs.enum.Trials
import zooklabs.model.Trial

case class TrialRepository(xa: Transactor[IO]) {

  val listTrialQuery: Trials => Query0[Trial] = trialName =>
    Query0[Trial](s"""SELECT zookid, name, position, score
         |FROM ${trialName.value}
         |ORDER BY position DESC
         |""".stripMargin)

  def listTrial(trialName: Trials): IO[List[Trial]] = {
    listTrialQuery(trialName).to[List].transact(xa)
  }

}
