package com.zooklabs.zook

import com.zooklabs.zook.achievement.trial._

case class Trial(sprint: Option[ZookTrial],
                 blockPush: Option[ZookTrial],
                 hurdles: Option[ZookTrial],
                 highJump: Option[ZookTrial],
                 lap: Option[ZookTrial])
