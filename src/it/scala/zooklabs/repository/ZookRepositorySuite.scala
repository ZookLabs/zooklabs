package zooklabs.repository

import cats.effect.IO
import cats.implicits.catsSyntaxOptionId
import doobie.Transactor
import doobie.scalatest.IOChecker
import eu.timepit.refined.types.all.NonNegInt
import eu.timepit.refined.types.string.NonEmptyString
import org.flywaydb.core.Flyway
import org.scalatest.BeforeAndAfterAll
import org.scalatest.funsuite.AnyFunSuite
import zooklabs.`enum`.Trials
import zooklabs.repository.model.ZookEntity

import java.time.{Clock, Instant, LocalDateTime, ZoneId}

class ZookRepositorySuite extends AnyFunSuite with IOChecker with BeforeAndAfterAll {

  val now: Instant                    = Instant.ofEpochSecond(1601324567)
  val nowLocalDateTime: LocalDateTime = LocalDateTime.now(Clock.fixed(now, ZoneId.systemDefault()))

  val transactor: doobie.Transactor[IO] = Transactor.fromDriverManager[IO](
    "org.postgresql.Driver",
    "jdbc:postgresql://localhost:5432/zooklabs",
    "Bernard",
    "Nosey"
  )
  
  override def beforeAll() {
    Flyway
      .configure()
      .dataSource(
        "jdbc:postgresql://localhost:5432/zooklabs",
        "Bernard",
        "Nosey"
      )
      .load()
      .migrate()
  }

  test("persistTrialQuery type checks") {
    check(ZookRepository.persistTrialQuery(Trials.Lap))
  }

  def zookEntityFixture: ZookEntity = ZookEntity(
    id = NonNegInt(0),
    name = NonEmptyString("testName"),
    height = 12.34,
    length = 12.34,
    width = 12.34,
    weight = 12.34,
    components = 123,
    dateCreated = nowLocalDateTime,
    dateUploaded = nowLocalDateTime,
    owner = 1.some,
    downloads = 1,
    views = 2
  )

  test("persistZookQuery type checks") {
    check(ZookRepository.persistZookQuery(zookEntityFixture))
  }

  test("dropZookQuery type checks") {
    check(ZookRepository.dropZookQuery(0))
  }

  test("getZookEntity type checks") {
    check(ZookRepository.getZookEntity(0))
  }

  test("listZooksQuery type checks") {
    check(ZookRepository.listZooksQuery)
  }

  test("getZookTrial type checks") {
    check(ZookRepository.getZookTrial(0)(Trials.Lap))
  }

  test("setOwnerQuery type checks") {
    check(ZookRepository.setOwnerQuery(0, 0))
  }

  test("incrementViewsQuery type checks") {
    check(ZookRepository.incrementViewsQuery(0))
  }

  test("incrementDownloadsQuery type checks") {
    check(ZookRepository.incrementDownloadsQuery(0))
  }

}
