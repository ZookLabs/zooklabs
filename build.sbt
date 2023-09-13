val appName = "zooklabs"

lazy val herokuSettings = Seq(
  Compile / herokuJdkVersion := "19",
  Compile / herokuAppName    := appName
)

lazy val root = (project in file("."))
  .settings(name := appName, organization := "com.zooklabs")
  .enablePlugins(JavaAppPackaging, BuildInfoPlugin)
  .configs(IntegrationTest)
  .settings(
    buildInfoKeys             := Seq[BuildInfoKey](name, version, scalaVersion, sbtVersion),
    buildInfoPackage          := appName,
    buildInfoUsePackageAsPath := true
  )
  .settings(
    scalaVersion := "2.13.12",
    herokuSettings,
    resolvers ++= Resolver.sonatypeOssRepos("snapshots"),
    resolvers += "zookcore" at "https://maven.pkg.github.com/BearRebel/ZookCore",
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
  .settings(scalaVersion := "2.13.12", version := Dependencies.Version.zookcore)
