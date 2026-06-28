import db from "../db/db.ts"
import {
  LeagueCounts,
  LeagueRanks,
  LeagueRanksContainer,
  LeagueTrial,
} from "../types.ts"
import { DatabaseSchema, TrialTables } from "../db/schema.ts"
import { Kysely } from "kysely"

const tableOrdering: Record<keyof TrialTables, "desc" | "asc"> = {
  sprint: "desc",
  block_push: "desc",
  hurdles: "desc",
  high_jump: "desc",
  lap: "asc",
  overall_league: "desc",
} as const

async function updateLeagueOrderQuery(
  trial: keyof TrialTables,
  database: Kysely<DatabaseSchema>,
): Promise<void> {
  await database
    .updateTable(trial)
    .from((eb) =>
      eb
        .selectFrom(trial)
        .select([
          "zookid",
          (eb) =>
            eb.fn
              .agg<number>("row_number")
              .over((ob) =>
                ob
                  .orderBy("score", tableOrdering[trial])
                  .orderBy("zookid", "asc")
              )
              .as("pos"),
        ])
        .where("disqualified", "=", false)
        .as("t")
    )
    .set((eb) => ({
      position: eb.ref("t.pos"),
    }))
    .whereRef(`${trial}.zookid`, "=", "t.zookid")
    .where(`${trial}.disqualified`, "=", false)
    .execute()

  // const tableName = this.getTableName(trial.value);

  // // Use raw SQL for complex window function query with dynamic table names
  // await db.executeQuery(
  //   sql`UPDATE ${sql.table(tableName)} trial SET position = t.pos
  //       FROM (
  //         SELECT row_number() OVER (ORDER BY t.score ${sql.raw(trial.ordering.sql)}, t.zookid ASC) as pos, t.zookid
  //         FROM ${sql.table(tableName)} t WHERE NOT t.disqualified
  //       ) t WHERE trial.zookid = t.zookid AND NOT trial.disqualified`.compile(
  //     db,
  //   ),
  // );
}

async function updateDisqualifiedQuery(
  trial: keyof TrialTables,
  database: Kysely<DatabaseSchema>,
): Promise<void> {
  await database
    .updateTable(trial)
    .set("position", 2147483647)
    .where("disqualified", "is", true)
    .where("position", "!=", 2147483647)
    .execute()
}

async function setLeagueUpdatedAtQuery(
  trial: keyof TrialTables,
  database: Kysely<DatabaseSchema>,
): Promise<void> {
  await database
    .updateTable("leagues_metadata")
    .set({ updatedAt: new Date() })
    .where("league", "=", trial)
    .execute()
}

class LeaguesRepo {
  async getLeader(trial: keyof TrialTables): Promise<number | null> {
    const result = await db
      .selectFrom(trial)
      .select("zookid")
      .where("position", "=", 1)
      .executeTakeFirst()
    return result?.zookid ?? null
  }

  async listLeague(trial: keyof TrialTables): Promise<LeagueTrial[]> {
    const results = await db
      .selectFrom(trial)
      .select(["zookid", "name", "score", "position"])
      .where("disqualified", "=", false)
      .orderBy("position")
      .execute()

    return results.map((r) => ({
      zookId: r.zookid,
      name: r.name,
      score: r.score,
      position: r.position,
    }))
  }

  async getLeagueUpdatedAt(
    trial: keyof TrialTables,
  ): Promise<Date | undefined> {
    const result = await db
      .selectFrom("leagues_metadata")
      .select("updatedAt")
      .where("league", "=", trial)
      .executeTakeFirst()
    return result?.updatedAt
  }

  async updateLeague(
    trial: keyof TrialTables,
    database: Kysely<DatabaseSchema>,
  ): Promise<void> {
    await updateLeagueOrderQuery(trial, database)
    await updateDisqualifiedQuery(trial, database)
    await setLeagueUpdatedAtQuery(trial, database)
  }

  async updateDefaultLeagues(): Promise<void> {
    await db.transaction().execute(async (trx) => {
      await this.updateLeague("sprint", trx)
      await this.updateLeague("block_push", trx)
      await this.updateLeague("hurdles", trx)
      await this.updateLeague("high_jump", trx)
      await this.updateLeague("lap", trx)
    })
  }

  async getCountQuery(trial: keyof TrialTables): Promise<number> {
    const result = await db
      .selectFrom(trial)
      .select((eb) => eb.fn.count<number>("zookid").as("count"))
      .where("disqualified", "=", false)
      .executeTakeFirst()
    return result?.count ? Number(result.count) : 0
  }

  async getLeagueCounts(): Promise<LeagueCounts> {
    const [sprint, blockPush, hurdles, highJump, lap] = await Promise.all([
      this.getCountQuery("sprint"),
      this.getCountQuery("block_push"),
      this.getCountQuery("hurdles"),
      this.getCountQuery("high_jump"),
      this.getCountQuery("lap"),
    ])

    return { sprint, blockPush, hurdles, highJump, lap }
  }

  async getRanksQuery(): Promise<LeagueRanks[]> {
    const results = await db
      .selectFrom("zook as z")
      .innerJoin("sprint as s", "z.id", "s.zookid")
      .innerJoin("block_push as b", "z.id", "b.zookid")
      .innerJoin("hurdles as h", "z.id", "h.zookid")
      .innerJoin("high_jump as hj", "z.id", "hj.zookid")
      .innerJoin("lap as l", "z.id", "l.zookid")
      .select([
        "z.id",
        "z.name",
        "s.position as sprint_position",
        "b.position as block_push_position",
        "h.position as hurdles_position",
        "hj.position as high_jump_position",
        "l.position as lap_position",
      ])
      .where("s.disqualified", "=", false)
      .where("b.disqualified", "=", false)
      .where("h.disqualified", "=", false)
      .where("hj.disqualified", "=", false)
      .where("l.disqualified", "=", false)
      .execute()

    return results.map((
      r: {
        id: number
        name: string
        sprintPosition: number
        blockPushPosition: number
        hurdlesPosition: number
        highJumpPosition: number
        lapPosition: number
      },
    ) => ({
      id: r.id,
      name: r.name,
      sprintPosition: r.sprintPosition,
      blockPushPosition: r.blockPushPosition,
      hurdlesPosition: r.hurdlesPosition,
      highJumpPosition: r.highJumpPosition,
      lapPosition: r.lapPosition,
    }))
  }

  async getRanks(): Promise<LeagueRanksContainer> {
    const [leagueRanks, leagueCounts] = await Promise.all([
      this.getRanksQuery(),
      this.getLeagueCounts(),
    ])
    return { leagueRanks, leagueCounts }
  }

  async insertOverallLeagueData(
    overallTrials: LeagueTrial[],
    database: Kysely<DatabaseSchema>,
  ): Promise<void> {
    // Use Kysely's batch insert with ON CONFLICT (upsert)
    for (const trial of overallTrials) {
      await database
        .insertInto("overall_league")
        .values({
          zookid: trial.zookId,
          name: trial.name,
          score: trial.score,
          position: trial.position,
          disqualified: false,
        })
        .onConflict((oc) =>
          oc.column("zookid").doUpdateSet({
            score: trial.score,
            position: trial.position,
          })
        )
        .execute()
    }
  }

  async updateOverallLeagueData(
    overallTrials: LeagueTrial[],
  ): Promise<void> {
    await db.transaction().execute(async (tx) => {
      await this.insertOverallLeagueData(overallTrials, tx)
      await setLeagueUpdatedAtQuery("overall_league", tx)
    })
  }
}

export default new LeaguesRepo()
