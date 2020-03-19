import com.typesafe.sbt.packager.docker.{DockerChmodType, DockerVersion}

val Http4sVersion = "0.21.1"
val DoobieVersion = "0.8.6"
val CirceVersion = "0.12.2"
val LogbackVersion = "1.2.3"
val refinedVersion = "0.9.12"
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
    resolvers += "zookcore" at "https://maven.pkg.github.com/BearRebel/ZookCore",
    dockerExposedPorts += 8080,
    dockerAlias := DockerAlias(Some("registry.heroku.com"), Some("zooklabs"), "web", None),
    dockerEnvVars := Map("HOST" -> "0.0.0.0"),
    dockerPackageMappings in Docker ++= List(baseDirectory.value / "scripts" / "entrypoint.sh" -> "/opt/docker/bin/entrypoint.sh"),
    dockerEntrypoint := "/opt/docker/bin/entrypoint.sh" +: dockerEntrypoint.value,
    dockerChmodType := DockerChmodType.UserGroupWriteExecute,
    dockerVersion := Some(DockerVersion(18, 9, 0, Some("ce"))),
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
      "ch.qos.logback" % "logback-classic" % LogbackVersion,
      "is.cir" %% "ciris" % "1.0.4",
      "is.cir" %% "ciris-refined" % "1.0.4",

      "com.beachape" %% "enumeratum" % "1.5.13",
      "io.circe" %% "circe-core" % "0.11.1",
      "io.circe" %% "circe-generic" % "0.11.1",
      "io.circe" %% "circe-parser" % "0.11.1",
      "com.typesafe.scala-logging" %% "scala-logging" % "3.9.2",
      "com.zooklabs" %% "zookcore" % "1.0.1",
      "org.typelevel" %% "cats-core" % "2.0.0",
      "org.typelevel" %% "cats-effect" % "2.1.2",
      "co.fs2" %% "fs2-core" % "2.1.0",
      "co.fs2" %% "fs2-io" % "2.1.0"
    )
  ).settings(
  libraryDependencies += "com.google.cloud" % "google-cloud-nio" % "0.120.0-alpha",
  //Required for google-cloud-nio to be installed as a filesystem provider
  fork in Compile := true
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

lazy val zookcoreStub = project.in(file("zookcore-stub"))
