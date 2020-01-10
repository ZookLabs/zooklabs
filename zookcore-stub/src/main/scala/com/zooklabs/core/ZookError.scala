package com.zooklabs.core

sealed trait ZookError

case object ImageMissingError                                 extends ZookError
case object StreetRulesError                                  extends ZookError
case class GeneralZookError(specificError: InnerGeneralError) extends ZookError
case object ExampleZookError                                  extends ZookError

sealed trait InnerGeneralError
case object InvalidHeaderZookError                extends InnerGeneralError
case object VersionAttributeMissingError          extends InnerGeneralError
case object ParseError                            extends InnerGeneralError
case object UsernameMissingError                  extends InnerGeneralError
case object PhysicalMissingError                  extends InnerGeneralError
case class ExceptionWrapper(exception: Exception) extends InnerGeneralError
