package zooklabs.program

import cats.effect.{ContextShift, ExitCode, IO, _}
import cats.implicits._
import eu.timepit.refined.auto.autoUnwrap
import fs2.Stream
import org.typelevel.log4cats.Logger
import org.http4s.client.Client
import org.http4s.implicits.http4sKleisliResponseSyntaxOptionT
import org.http4s.server.blaze.BlazeServerBuilder
import org.http4s.server.middleware.CORS
import org.http4s.server.{AuthMiddleware, Router}
import zooklabs.conf.AppConfig
import zooklabs.endpoints._
import zooklabs.endpoints.model.AuthUser
import zooklabs.jwt.{JwtCreator, JwtMiddleware}
import zooklabs.persistence.Persistence
import zooklabs.repository.{LeagueRepository, TournamentRepository, UserRepository, ZookRepository}

import scala.concurrent.duration._
final class ServerProgram(
    conf: AppConfig,
    client: Client[IO],
    leagueRepository: LeagueRepository,
    zookRepository: ZookRepository,
    usersRepository: UserRepository,
    tournamentRepository: TournamentRepository,
    blocker: Blocker,
    persistence: Persistence[IO]
)(implicit logger: Logger[IO], contextShift: ContextShift[IO], timer: Timer[IO]) {

  def run(): Stream[IO, ExitCode] = {

    val jwtCreator: JwtCreator[AuthUser] = new JwtCreator[AuthUser](conf.jwtCreds, 7.days)

    val permissiveSecureMiddleware: AuthMiddleware[IO, AuthUser] =
      JwtMiddleware.make[AuthUser](conf.jwtCreds, recoverWith = AuthUser.anonymousUser.some)
    val secureMiddleware: AuthMiddleware[IO, AuthUser]           = JwtMiddleware.make[AuthUser](conf.jwtCreds)

    val api = Router(
      "/login"       -> new LoginEndpoints(
        conf.discordOAuthConfig,
        client,
        usersRepository,
        jwtCreator,
        secureMiddleware
      ).endpoints,
      "/zooks"       -> new ZookEndpoints(
        persistence,
        conf.discordWebhook,
        zookRepository,
        client,
        permissiveSecureMiddleware
      ).endpoints,
      "/leagues"     -> new LeaguesEndpoints(leagueRepository).endpoints,
      "/users"       -> new UserEndpoints(usersRepository).endpoints,
      "/tournaments" -> new TournamentEndpoints(tournamentRepository).endpoints
    )

    val httpApp = Router(
      "/health" -> HealthEndpoint.endpoint,
      "/api"    -> api,
      "/static" -> new StaticEndpoints(blocker).endpoints
    ).orNotFound

    val corsHttpApp = CORS(
      httpApp,
      CORS.DefaultCORSConfig
    )
    BlazeServerBuilder[IO]
      .bindHttp(conf.post, conf.host)
      .withHttpApp(corsHttpApp)
      .serve
  }
}
