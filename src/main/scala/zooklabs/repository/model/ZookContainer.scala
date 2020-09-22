package zooklabs.repository.model

import zooklabs.model.ZookTrial

final case class ZookContainer(
    zook: ZookEntity,
    sprint: Option[ZookTrial],
    blockPush: Option[ZookTrial],
    hurdles: Option[ZookTrial],
    highJump: Option[ZookTrial],
    lap: Option[ZookTrial]
)
