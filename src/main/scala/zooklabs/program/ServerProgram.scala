package zooklabs.program

import cats.effect.{ExitCode, IO, Temporal}
import cats.implicits._
import eu.timepit.refined.auto.autoUnwrap
import fs2.Stream
import org.http4s.blaze.server.BlazeServerBuilder
import org.http4s.client.Client
import org.http4s.implicits.http4sKleisliResponseSyntaxOptionT
import org.http4s.server.middleware.CORS
import org.http4s.server.{AuthMiddleware, Router}
import org.typelevel.log4cats.Logger
import zooklabs.conf.AppConfig
import zooklabs.endpoints._
import zooklabs.endpoints.model.AuthUser
import zooklabs.jwt.{JwtCreator, JwtMiddleware}
import zooklabs.persistence.Persistence
import zooklabs.repository.{LeagueRepository, TournamentRepository, UserRepository, ZookRepository}

import scala.concurrent.ExecutionContext
import scala.concurrent.duration._
final class ServerProgram(
    conf: AppConfig,
    client: Client[IO],
    leagueRepository: LeagueRepository,
    zookRepository: ZookRepository,
    usersRepository: UserRepository,
    tournamentRepository: TournamentRepository,
    persistence: Persistence[IO],
    executionContext: ExecutionContext
)(implicit logger: Logger[IO], timer: Temporal[IO]) {

  def run(): Stream[IO, ExitCode] = {

    val jwtCreator: JwtCreator[AuthUser] = new JwtCreator[AuthUser](conf.jwtCreds, 7.days)

    val permissiveSecureMiddleware: AuthMiddleware[IO, AuthUser] =
      JwtMiddleware.make[AuthUser](conf.jwtCreds, recoverWith = AuthUser.anonymousUser.some)
    val secureMiddleware: AuthMiddleware[IO, AuthUser] = JwtMiddleware.make[AuthUser](conf.jwtCreds)

    val api = Router(
      "/login" -> new LoginEndpoints(
        conf.discordOAuthConfig,
        client,
        usersRepository,
        jwtCreator,
        secureMiddleware
      ).endpoints,
      "/zooks" -> new ZookEndpoints(
        persistence,
        conf.discordWebhook,
        zookRepository,
        client,
        permissiveSecureMiddleware
      ).endpoints,
      "/leagues"     -> new LeaguesEndpoints(leagueRepository).endpoints,
      "/users"       -> new UserEndpoints(usersRepository).endpoints,
      "/tournaments" -> new TournamentEndpoints(tournamentRepository).endpoints,
      "/admin"   -> new AdminEndpoints(zookRepository, usersRepository, secureMiddleware).endpoints,
      "/version" -> VersionEndpoint.endpoint
    )

    val httpApp = Router(
      "/health" -> HealthEndpoint.endpoint,
      "/api"    -> api,
      "/static" -> new StaticEndpoints(zookRepository).endpoints
    ).orNotFound

    val corsHttpApp = CORS.policy
      .withAllowCredentials(true)
      .withAllowOriginHost(Set(conf.corsHost))(httpApp)

    BlazeServerBuilder[IO](executionContext)
      .bindHttp(conf.post, conf.host)
      .withHttpApp(corsHttpApp)
      .serve
  }
}
