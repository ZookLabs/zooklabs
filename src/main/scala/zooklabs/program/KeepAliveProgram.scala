package zooklabs.program

import cats.effect.{IO, Timer}
import fs2.Stream
import org.http4s.Uri
import org.http4s.client.Client

import scala.concurrent.duration._

final class KeepAliveProgram(client: Client[IO])(implicit timer: Timer[IO]) {

  def run(): Stream[IO, Unit] = {
    Stream
      .repeatEval(
        client.statusFromUri(Uri.unsafeFromString("http://api.zooklabs.com/health")).void
      )
      .metered(10.minutes)
  }

}
