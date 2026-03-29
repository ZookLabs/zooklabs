import { Kysely, Transaction } from "kysely"
import db from "../db/db.ts"
import { DatabaseSchema, TrialTables } from "../db/schema.ts"
import {
  createTrialEntity,
  TrialEntity,
  UserIdentifier,
  Zook,
  ZookAbout,
  ZookAchievement,
  ZookContainer,
  ZookEntity,
  ZookIdentifier,
  ZookPhysical,
  ZookTrial,
} from "../types.ts"
import { getUsernameQuery } from "./usersRepo.ts"

export const getTrialQuery = async (
  trial: keyof TrialTables,
  zookId: number,
  database: Transaction<DatabaseSchema>, // maybe not?
): Promise<ZookTrial | undefined> =>
  await database
    .selectFrom(trial)
    .select(["score", "position", "disqualified"])
    .where("zookid", "=", zookId)
    .$castTo<ZookTrial>()
    .executeTakeFirst()

export const getEntityQuery = async (
  zookId: number,
  incrementViews: boolean,
  database: Kysely<DatabaseSchema>,
): Promise<ZookEntity> => {
  const result = await database
    .updateTable("zook")
    .set((eb) => ({ views: eb("views", "+", incrementViews ? 1 : 0) }))
    .where("id", "=", zookId)
    .returning([
      "id",
      "name",
      "height",
      "length",
      "width",
      "weight",
      "components",
      "datecreated",
      "dateuploaded",
      "owner",
      "downloads",
      "views",
    ])
    .executeTakeFirstOrThrow()

  return {
    ...result,
    datecreated: new Date(result.datecreated),
    dateuploaded: new Date(result.dateuploaded),
    owner: result.owner ?? undefined,
  }
}

class ZookRepo {
  async list(): Promise<Array<ZookIdentifier>> {
    return await db
      .selectFrom("zook")
      .select(["id", "name"])
      .orderBy("id", "desc")
      .execute()
  }

  async getZook(id: number, increaseViews: boolean) {
    return await db.transaction().execute(async (trx) => {
      const zookEntity: ZookEntity = await getEntityQuery(
        id,
        increaseViews,
        trx,
      )

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
        getTrialQuery("sprint", id, trx),
        getTrialQuery("block_push", id, trx),
        getTrialQuery("hurdles", id, trx),
        getTrialQuery("high_jump", id, trx),
        getTrialQuery("lap", id, trx),
        getTrialQuery("overall_league", id, trx),
      ])

      const zookAchievements: ZookAchievement = {
        sprint: sprintTrial,
        blockPush: blockPushTrial,
        hurdles: hurdlesTrial,
        highJump: highJumpTrial,
        lap: lapTrial,
        overall: overallTrial,
      }

      const anonymousUser: UserIdentifier = { username: "Anonymous" }

      const zookOwner: UserIdentifier = zookEntity.owner
        ? ((await getUsernameQuery(zookEntity.owner, trx)) ?? anonymousUser)
        : anonymousUser

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

        return dateTimeFormat
          .formatToParts(date)
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
    })
  }

  async incrementDownloads(zookId: number): Promise<void> {
    await db
      .updateTable("zook")
      .set((eb) => ({ downloads: eb("downloads", "+", 1) }))
      .where("id", "=", zookId)
      .execute()
  }

  async persistZook(
    zookContainer: ZookContainer,
    transactionalFunction: (zookId: number) => Promise<void>,
  ): Promise<number> {
    try {
      return await db.transaction().execute(async (trx) => {
        // Persist the Zook entity and get the generated ID
        const zookResult = await trx
          .insertInto("zook")
          .values({
            name: zookContainer.zook.name,
            height: zookContainer.zook.height,
            length: zookContainer.zook.length,
            width: zookContainer.zook.width,
            weight: zookContainer.zook.weight,
            components: zookContainer.zook.components,
            datecreated: zookContainer.zook.datecreated.toISOString(),
            dateuploaded: zookContainer.zook.dateuploaded.toISOString(),
            owner: zookContainer.zook.owner ?? null,
            downloads: 0,
            views: 0,
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        const zookId = zookResult.id

        const toEntity = (zookTrial: ZookTrial): TrialEntity =>
          createTrialEntity(zookId, zookContainer.zook.name, zookTrial.score)

        // Insert into trial tables conditionally
        if (zookContainer.sprint) {
          const entity = toEntity(zookContainer.sprint)
          await trx
            .insertInto("sprint")
            .values({
              zookid: entity.zookid,
              name: entity.name,
              score: entity.score,
              position: entity.position ?? 2147483647,
              disqualified: entity.disqualified ?? false,
            })
            .execute()
        }
        if (zookContainer.blockPush) {
          const entity = toEntity(zookContainer.blockPush)
          await trx
            .insertInto("block_push")
            .values({
              zookid: entity.zookid,
              name: entity.name,
              score: entity.score,
              position: entity.position ?? 2147483647,
              disqualified: entity.disqualified ?? false,
            })
            .execute()
        }
        if (zookContainer.hurdles) {
          const entity = toEntity(zookContainer.hurdles)
          await trx
            .insertInto("hurdles")
            .values({
              zookid: entity.zookid,
              name: entity.name,
              score: entity.score,
              position: entity.position ?? 2147483647,
              disqualified: entity.disqualified ?? false,
            })
            .execute()
        }
        if (zookContainer.highJump) {
          const entity = toEntity(zookContainer.highJump)
          await trx
            .insertInto("high_jump")
            .values({
              zookid: entity.zookid,
              name: entity.name,
              score: entity.score,
              position: entity.position ?? 2147483647,
              disqualified: entity.disqualified ?? false,
            })
            .execute()
        }
        if (zookContainer.lap) {
          const entity = toEntity(zookContainer.lap)
          await trx
            .insertInto("lap")
            .values({
              zookid: entity.zookid,
              name: entity.name,
              score: entity.score,
              position: entity.position ?? 2147483647,
              disqualified: entity.disqualified ?? false,
            })
            .execute()
        }

        await transactionalFunction(zookId)

        return zookId
      })
    } catch (error) {
      console.error("Error persisting Zook:", error)
      throw error
    }
  }

  async setOwner(zookId: number, ownerId: number): Promise<void> {
    await db
      .updateTable("zook")
      .set({ owner: ownerId })
      .where("id", "=", zookId)
      .execute()
  }
}
export default new ZookRepo()
