package zooklabs.jwt

import ciris.Secret
import eu.timepit.refined.types.string.NonEmptyString
import pdi.jwt.algorithms.JwtHmacAlgorithm

case class JwtCreds(key: Secret[NonEmptyString], algorithm: JwtHmacAlgorithm)
