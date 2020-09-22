package zooklabs.endpoints

import eu.timepit.refined.W
import eu.timepit.refined.api.Refined
import eu.timepit.refined.string.MatchesRegex

package object discord {

  type AccessToken  = String Refined MatchesRegex[W.`"[-a-zA-Z0-9._~+/]+=*"`.T]
  type RefreshToken = String Refined MatchesRegex[W.`"[-a-zA-Z0-9._~+/]+=*"`.T]
}
