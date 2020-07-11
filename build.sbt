
import com.typesafe.sbt.packager.docker.{DockerChmodType, DockerVersion}

lazy val dockerSettings = List(
  dockerBaseImage := "openjdk:8-jre-alpine",
  dockerExposedPorts += 8080,
  dockerAlias := DockerAlias(Some("registry.heroku.com"), Some("zooklabs"), "web", None),
  dockerEnvVars := Map("HOST" -> "0.0.0.0"),
  dockerPackageMappings in Docker ++= List(baseDirectory.value / "scripts" / "entrypoint.sh" -> "/opt/docker/bin/entrypoint.sh"),
  dockerEntrypoint := "/opt/docker/bin/entrypoint.sh" +: dockerEntrypoint.value,
  dockerChmodType := DockerChmodType.UserGroupWriteExecute,
  dockerVersion := Some(DockerVersion(18, 9, 0, Some("ce"))),
)

lazy val root = (project in file("."))
  .settings(name := "zooklabs",
  organization := "com.zooklabs",
  )
  .enablePlugins(JavaAppPackaging, DockerPlugin)
  .configs(IntegrationTest)
  .settings(
    version := "0.0.1-SNAPSHOT",
    scalaVersion := "2.13.3",
    dockerSettings,
    resolvers ++= Dependencies.resolvers,
    addCompilerPlugin("com.olegpy" %% "better-monadic-for" % "0.3.1"),
    libraryDependencies ++= Dependencies.dependencies,
    libraryDependencies ++= Dependencies.testDependencies,
    Defaults.itSettings,
    fork in run := true, // required for SBT to correctly allow IOApps to release resources on termination
    // fork in Compile := true // required for google-cloud-nio to be installed as a filesystem provider
  )


lazy val zookcoreStub = project.in(file("zookcore-stub"))
