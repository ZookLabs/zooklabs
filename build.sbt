import com.typesafe.sbt.packager.docker.{DockerChmodType, DockerVersion}
import sbtrelease.ReleasePlugin.autoImport.ReleaseTransformations._

lazy val dockerSettings = List(
  dockerBaseImage := "adoptopenjdk/openjdk11:alpine-slim",
  dockerExposedPorts += 8080,
  dockerAlias := DockerAlias(Some("registry.heroku.com"), Some("zooklabs"), "web", None),
  Docker / dockerPackageMappings ++= List(
    baseDirectory.value / "scripts" / "entrypoint" -> "/opt/docker/bin/entrypoint"
  ),
  dockerEntrypoint := "/opt/docker/bin/entrypoint" +: dockerEntrypoint.value,
  dockerChmodType  := DockerChmodType.UserGroupWriteExecute,
  dockerVersion    := Some(DockerVersion(18, 9, 0, Some("ce"))) // required for github actions
)

lazy val releaseSettings = Seq(
  releaseUseGlobalVersion     := true,
  releaseIgnoreUntrackedFiles := true,
  releaseTagName              := s"v${(ThisBuild / version).value}",
  releaseTagComment           := s"Release version ${(ThisBuild / version).value}",
  releaseCommitMessage        := s"Set version to ${(ThisBuild / version).value} [ci skip]",
  releaseProcess := Seq[ReleaseStep](
    checkSnapshotDependencies,
    inquireVersions,
    setReleaseVersion,
    releaseStepCommand("docker:publish"),
    commitReleaseVersion,
    tagRelease,
    setNextVersion,
    commitNextVersion,
    pushChanges
  )
)

lazy val root = (project in file("."))
  .settings(name := "zooklabs", organization := "com.zooklabs")
  .enablePlugins(JavaAppPackaging, DockerPlugin, AshScriptPlugin, BuildInfoPlugin)
  .configs(IntegrationTest)
  .settings(
    buildInfoKeys             := Seq[BuildInfoKey](name, version, scalaVersion, sbtVersion),
    buildInfoPackage          := "zooklabs",
    buildInfoUsePackageAsPath := true
  )
  .settings(
    scalaVersion := "2.13.6",
    releaseSettings,
    dockerSettings,
    resolvers ++= Dependencies.resolvers,
    addCompilerPlugin("com.olegpy" %% "better-monadic-for" % "0.3.1"),
    libraryDependencies ++= Dependencies.dependencies,
    libraryDependencies ++= Dependencies.testDependencies,
    Defaults.itSettings,
    run / fork := true, // required for SBT to correctly allow IOApps to release resources on termination
    Compile / fork := true // required for google-cloud-nio to be installed as a filesystem provider
  )

lazy val zookcoreStub = project
  .in(file("zookcore-stub"))
  .settings(name := "zookcore", organization := "com.zooklabs")
  .settings(scalaVersion := "2.13.6", version := Dependencies.Version.zookcore)
