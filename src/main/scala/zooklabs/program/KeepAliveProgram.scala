package zooklabs.program

import cats.effect.IO
import fs2.Stream
import org.http4s.client.Client
import org.http4s.implicits._

import scala.concurrent.duration._
import cats.effect.Temporal

final class KeepAliveProgram(client: Client[IO])(implicit timer: Temporal[IO]) {

  def run(): Stream[IO, Unit] = {
    Stream
      .repeatEval(
        client.statusFromUri(uri"http://api.zooklabs.com/health").void
      )
      .metered(10.minutes)
  }

}
