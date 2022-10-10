package zooklabs.program
import cats.effect.IO
import org.http4s.{HttpRoutes, Status}
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import zooklabs.endpoints.UserEndpoints
import zooklabs.endpoints.model.users.{User, UserAbout, UserIdentifier}
import zooklabs.program.mock.MockUserRepository
import zooklabs.repository.UserRepository
import zooklabs.types.Username

import java.time.LocalDateTime

class UserEndpointsSuite extends munit.Http4sHttpRoutesSuite {

  override val routes: HttpRoutes[IO] = HttpRoutes.fail

  implicit val logger: Logger[IO] = Slf4jLogger.create[IO].unsafeRunSync()

  def routes(userRepository: UserRepository): HttpRoutes[IO] = new UserEndpoints(
    userRepository
  ).endpoints

  test(GET(uri"/NonExistentUser"))
    .withRoutes(routes(MockUserRepository.getUserMock(None)))
    .alias("getting nonexistent user should return NotFound and empty body") { response =>
      assertEquals(response.status, Status.NotFound)
      assertIO(response.as[String], "")
    }

  test(GET(uri"/UserExists"))
    .withRoutes(
      routes(
        MockUserRepository.getUserMock(
          Some(
            User(
              identifier = UserIdentifier(Username.unsafeFrom("UserExists")),
              about = UserAbout(
                signUpAt = LocalDateTime.of(2022, 10, 7, 13, 37),
                lastLoginAt = LocalDateTime.of(2022, 10, 10, 23, 56)
              ),
              zooks = List.empty
            )
          )
        )
      )
    )
    .alias("getting existent user should return OK and JsonBody") { response =>
      assertEquals(response.status, Status.Ok)
      assertIO(
        response.as[String],
        "{\"identifier\":{\"username\":\"UserExists\"},\"about\":{\"signUpAt\":\"Friday 7 October 2022\",\"lastLoginAt\":\"Monday 10 October 2022\"},\"zooks\":[]}"
      )
    }

  test(GET(uri"/InvalidUsername*Bang!"))
    .withRoutes(routes(MockUserRepository.stub))
    .alias(
      "getting Invalid username should return NotFound, empty body and not call the database"
    ) { response =>
      assertEquals(response.status, Status.NotFound)
      assertIO(response.as[String], "")
    }
}
