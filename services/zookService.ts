import zookRepo from "../repositories/zookRepo.ts"
import {
  UserIdentifier,
  Zook,
  ZookAbout,
  ZookAchievement,
  ZookEntity,
  ZookIdentifier,
  ZookPhysical,
} from "../types.ts"

export const listZooks = async () => {
  return await zookRepo.list()
}

export const getZook = async (id: number, increaseViews: boolean) => {
  const zookEntity: ZookEntity = increaseViews
    ? await zookRepo.getEntityIncreaseViews(id)
    : await zookRepo.getEntity(id)

  if (zookEntity == undefined) {
    return undefined
  }

  const [
    sprintTrial,
    blockPushTrial,
    hurdlesTrial,
    highJumpTrial,
    lapTrial,
    overallTrial,
  ] = await Promise.all([
    zookRepo.getTrial("sprint", id),
    zookRepo.getTrial("block_push", id),
    zookRepo.getTrial("hurdles", id),
    zookRepo.getTrial("high_jump", id),
    zookRepo.getTrial("lap", id),
    zookRepo.getTrial("overall_league", id),
  ])

  const zookAchievements: ZookAchievement = {
    sprint: sprintTrial,
    blockPush: blockPushTrial,
    hurdles: hurdlesTrial,
    highJump: highJumpTrial,
    lap: lapTrial,
    overall: overallTrial,
  }

  const zookOwner: UserIdentifier = await zookRepo.getOwner(
    zookEntity.owner,
  )

  const zookIdentifier: ZookIdentifier = {
    id: zookEntity.id,
    name: zookEntity.name,
  }

  function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }

    const dateTimeFormat = new Intl.DateTimeFormat("en-GB", options)

    return dateTimeFormat.formatToParts(date)
      .filter((p) => p.type != "literal")
      .map((p) => p.value)
      .join(" ")
  }

  const zookAbout: ZookAbout = {
    owner: zookOwner,
    dateCreated: formatDate(zookEntity.datecreated),
    dateUploaded: formatDate(zookEntity.dateuploaded),
    downloads: zookEntity.downloads,
    views: zookEntity.views,
  }

  const zookPhysical: ZookPhysical = {
    height: zookEntity.height,
    length: zookEntity.length,
    width: zookEntity.width,
    weight: zookEntity.weight,
    components: zookEntity.components,
  }

  return {
    identifier: zookIdentifier,
    about: zookAbout,
    physical: zookPhysical,
    achievement: zookAchievements,
  } as Zook
}
