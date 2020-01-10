val Http4sVersion = "0.21.0-M6"
val DoobieVersion = "0.8.6"
val CirceVersion = "0.12.2"
val Specs2Version = "4.1.0"
val LogbackVersion = "1.2.3"
val refinedVersion = "0.9.10"
libraryDependencies ++= Seq(
  "eu.timepit" %% "refined" % refinedVersion,
  "eu.timepit" %% "refined-cats" % refinedVersion
)

lazy val root = (project in file("."))
  .enablePlugins(JavaAppPackaging, DockerPlugin)
  .settings(
    organization := "com.zooklabs",
    name := "zooklabs",
    version := "0.0.1-SNAPSHOT",
    scalaVersion := "2.12.8",
    dockerExposedPorts += 8080,
    dockerAlias := DockerAlias(Some("registry.heroku.com"), Some("zooklabs"), "web", None),
    libraryDependencies ++= Seq(
      "org.http4s" %% "http4s-core" % Http4sVersion,
      "org.http4s" %% "http4s-server" % Http4sVersion,
      "org.http4s" %% "http4s-blaze-server" % Http4sVersion,
      "org.http4s" %% "http4s-blaze-client" % Http4sVersion,
      "org.http4s" %% "http4s-circe" % Http4sVersion,
      "org.http4s" %% "http4s-dsl" % Http4sVersion,
      "org.tpolecat" %% "doobie-core" % DoobieVersion,

      "org.tpolecat" %% "doobie-hikari" % DoobieVersion,
      "org.tpolecat" %% "doobie-postgres" % DoobieVersion,

      "org.postgresql" % "postgresql" % "42.2.9",

      "org.flywaydb" % "flyway-core" % "6.0.6",
      "io.circe" %% "circe-generic" % CirceVersion,
      "org.specs2" %% "specs2-core" % Specs2Version % "test",
      "ch.qos.logback" % "logback-classic" % LogbackVersion,
      "is.cir" %% "ciris" % "1.0.2",
      "is.cir" %% "ciris-refined" % "1.0.2",

      "com.beachape" %% "enumeratum" % "1.5.13",
      "io.circe" %% "circe-core" % "0.11.1",
      "io.circe" %% "circe-generic" % "0.11.1",
      "io.circe" %% "circe-parser" % "0.11.1",
       "com.google.cloud" % "google-cloud-nio" % "0.120.0-alpha",
      "com.zooklabs" %% "zookcore" % "1.0.0"
    )
  )

scalacOptions ++= Seq(
  "-deprecation",
  "-encoding", "UTF-8",
  "-language:higherKinds",
  "-language:postfixOps",
  "-feature",
  "-Ypartial-unification",
  "-Xfatal-warnings",
)

lazy val zookcore-stub = project.in(file("zookcore-stub"))
