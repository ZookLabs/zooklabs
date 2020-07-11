import sbt._

object Dependencies {
  object Version {
    val http4s         = "0.21.1"
    val doobie         = "0.8.6"
    val circe          = "0.12.2"
    val Logback        = "1.2.3"
    val refined        = "0.9.12"
    val tsec           = "0.2.1"
    val log4Cats       = "1.1.1"
    val ciris          = "1.1.1"
    val fs2            = "2.4.2"
    val scalatest      = "3.2.0"
    val dockerTestKit  = "0.9.9"
    val googleCloudNio = "0.121.2"
    val flyway         = "6.5.0"
    val zookCore       = "1.0.1"
    val cats           = "2.1.1"
    val catsEffect     = "2.1.3"
    val postgres       = "42.2.9"
  }

  object Library {

    val http4s = Seq(
      "org.http4s" %% "http4s-core",
      "org.http4s" %% "http4s-server",
      "org.http4s" %% "http4s-blaze-server",
      "org.http4s" %% "http4s-blaze-client",
      "org.http4s" %% "http4s-circe",
      "org.http4s" %% "http4s-dsl"
    ).map(_ % Version.http4s)

    val doobie = Seq(
      "org.tpolecat" %% "doobie-core",
      "org.tpolecat" %% "doobie-hikari",
      "org.tpolecat" %% "doobie-postgres"
    ).map(_ % Version.doobie)

    val circe = Seq(
      "io.circe" %% "circe-core",
      "io.circe" %% "circe-generic",
      "io.circe" %% "circe-parser"
    ).map(_ % Version.circe)

    val refined = Seq(
      "eu.timepit" %% "refined",
      "eu.timepit" %% "refined-cats"
    ).map(_ % Version.refined)

    val tsec = Seq(
      "io.github.jmcardon" %% "tsec-common",
      "io.github.jmcardon" %% "tsec-password",
      "io.github.jmcardon" %% "tsec-cipher-jca",
      "io.github.jmcardon" %% "tsec-cipher-bouncy",
      "io.github.jmcardon" %% "tsec-mac",
      "io.github.jmcardon" %% "tsec-signatures",
      "io.github.jmcardon" %% "tsec-hash-jca",
      "io.github.jmcardon" %% "tsec-hash-bouncy",
      "io.github.jmcardon" %% "tsec-libsodium",
      "io.github.jmcardon" %% "tsec-jwt-mac",
      "io.github.jmcardon" %% "tsec-jwt-sig",
      "io.github.jmcardon" %% "tsec-http4s"
    ).map(_ % Version.tsec)

    val log4cats = Seq(
      "io.chrisdavenport" %% "log4cats-core",
      "io.chrisdavenport" %% "log4cats-slf4j"
    ).map(_ % Version.log4Cats)

    val ciris = Seq(
      "is.cir" %% "ciris",
      "is.cir" %% "ciris-refined"
    ).map(_ % Version.ciris)

    val fs2 = Seq("co.fs2" %% "fs2-core", "co.fs2" %% "fs2-io").map(_ % Version.fs2)

    val googleCloudNio = "com.google.cloud" % "google-cloud-nio" % Version.googleCloudNio

    val scalatest = "org.scalatest" %% "scalatest" % Version.scalatest

    val dockerTestKit = List(
      "com.whisk" %% "docker-testkit-scalatest",
      "com.whisk" %% "docker-testkit-impl-docker-java"
    ).map(_ % Version.dockerTestKit)

    val flyway = "org.flywaydb" % "flyway-core" % Version.flyway

    val postgres = "org.postgresql" % "postgresql" % Version.postgres

    val zookCore = "com.zooklabs" %% "zookcore" % Version.zookCore

    val cats       = "org.typelevel" %% "cats-core"   % Version.cats
    val catsEffect = "org.typelevel" %% "cats-effect" % Version.catsEffect
  }

  object Resolvers {
    val zookcore = "zookcore" at "https://maven.pkg.github.com/BearRebel/ZookCore"
  }

  lazy val dependencies: List[ModuleID] =
    List(Library.googleCloudNio,
         Library.flyway,
         Library.postgres,
         Library.zookCore,
         Library.cats,
         Library.catsEffect) ++
      Library.http4s ++
      Library.doobie ++
      Library.circe ++
      Library.ciris ++
      Library.refined ++
//      Library.tsec ++
      Library.log4cats ++
      Library.fs2

  lazy val testDependencies: List[ModuleID] = List(Library.scalatest)
    .map(_ % "it,test") ++ Library.dockerTestKit
    .map(_ % "it,test")

  lazy val resolvers: List[MavenRepository] = List(Resolvers.zookcore)

}
