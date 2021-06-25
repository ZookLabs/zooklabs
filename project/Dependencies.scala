import sbt._

object Dependencies {
  object Version {
    val cats           = "2.6.1"
    val catsEffect     = "3.1.1"
    val circe          = "0.14.1"
    val ciris          = "2.0.1"
    val doobie         = "1.0.0-M5"
    val flyway         = "7.10.0"
    val fs2            = "3.0.4"
    val googleCloudNio = "0.123.2"
    val http4s         = "0.23.0-RC1"
    val log4Cats       = "2.1.1"
    val logback        = "1.2.3"
    val logbackClassic = "1.2.3"
    val postgres       = "42.2.22"
    val refined        = "0.9.26"
    val scalaJwt       = "8.0.2"
    val scalatest      = "3.2.9"
    val zookcore       = "1.0.2"
  }

  object Library {

    val http4s: Seq[ModuleID] = Seq(
      "org.http4s" %% "http4s-core",
      "org.http4s" %% "http4s-server",
      "org.http4s" %% "http4s-blaze-server",
      "org.http4s" %% "http4s-blaze-client",
      "org.http4s" %% "http4s-circe",
      "org.http4s" %% "http4s-dsl"
    ).map(_ % Version.http4s)

    val doobie: Seq[ModuleID] = Seq(
      "org.tpolecat" %% "doobie-core",
      "org.tpolecat" %% "doobie-hikari",
      "org.tpolecat" %% "doobie-postgres",
      "org.tpolecat" %% "doobie-postgres-circe",
      "org.tpolecat" %% "doobie-refined"
    ).map(_ % Version.doobie)

    val doobieTest            = "org.tpolecat" %% "doobie-scalatest" % Version.doobie

    val circe: Seq[ModuleID]    = Seq(
      "io.circe" %% "circe-core",
      "io.circe" %% "circe-generic",
      "io.circe" %% "circe-parser",
      "io.circe" %% "circe-refined"
    ).map(_ % Version.circe)

    val refined: Seq[ModuleID]  = Seq(
      "eu.timepit" %% "refined",
      "eu.timepit" %% "refined-cats"
    ).map(_ % Version.refined)

    val log4cats: Seq[ModuleID] = Seq(
      "log4cats-core",
      "log4cats-slf4j"
    ).map("org.typelevel" %% _ % Version.log4Cats)

    val logbackClassic          = "ch.qos.logback" % "logback-classic" % Version.logbackClassic

    val ciris: Seq[ModuleID] = Seq(
      "is.cir" %% "ciris",
      "is.cir" %% "ciris-refined"
    ).map(_ % Version.ciris)

    val fs2: Seq[ModuleID]   = Seq("co.fs2" %% "fs2-core", "co.fs2" %% "fs2-io").map(_ % Version.fs2)

    val googleCloudNio = "com.google.cloud" % "google-cloud-nio" % Version.googleCloudNio

    val scalatest = "org.scalatest" %% "scalatest" % Version.scalatest

    val flyway = "org.flywaydb" % "flyway-core" % Version.flyway

    val postgres = "org.postgresql" % "postgresql" % Version.postgres

    val zookcore = "com.zooklabs" %% "zookcore" % Version.zookcore

    val cats       = "org.typelevel" %% "cats-core"   % Version.cats
    val catsEffect = "org.typelevel" %% "cats-effect" % Version.catsEffect

    val scalaJwt: Seq[ModuleID] = List(
      "com.github.jwt-scala" %% "jwt-core",
      "com.github.jwt-scala" %% "jwt-circe"
    ).map(_ % Version.scalaJwt)

  }

  object Resolvers {
    val zookcore: MavenRepository = "zookcore" at "https://maven.pkg.github.com/BearRebel/ZookCore"
  }

  lazy val dependencies: List[ModuleID] =
    List(
      Library.googleCloudNio,
      Library.flyway,
      Library.postgres,
      Library.zookcore,
      Library.cats,
      Library.catsEffect,
      Library.logbackClassic
    ) ++
      Library.http4s ++
      Library.doobie ++
      Library.circe ++
      Library.ciris ++
      Library.refined ++
      Library.scalaJwt ++
      Library.log4cats ++
      Library.fs2

  lazy val testDependencies: List[ModuleID] =
    List(Library.scalatest, Library.doobieTest)
      .map(_ % "it,test")

  lazy val resolvers: List[MavenRepository] =
    List(Resolvers.zookcore, Resolver.sonatypeRepo("snapshots"))

}
