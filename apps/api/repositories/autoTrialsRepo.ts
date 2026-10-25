import db from "../db/db.ts"
import {AutoTrialResultsEntity} from "../types.ts";


class AutoTrialsRepo {

    async getAutoTrialResults(zookId: number): Promise<AutoTrialResultsEntity | undefined> {
        const result = await db.selectFrom("auto_trial_results")
            .select(["zookid", "sprint", "blockPush", "hurdles", "highJump", "lap"])
            .where("zookid", "=", zookId)
            .executeTakeFirst();

        if (!result) return undefined;

        // The driver returns double precision columns as strings
        return {
            zookId: result.zookid,
            sprint: Number(result.sprint),
            blockPush: Number(result.blockPush),
            hurdles: Number(result.hurdles),
            highJump: Number(result.highJump),
            lap: Number(result.lap)
        };
    }

    async addAutoTrialResults(results: AutoTrialResultsEntity): Promise<void> {
        await db.insertInto("auto_trial_results")
            .values({
                zookid: results.zookId,
                sprint: results.sprint,
                blockPush: results.blockPush,
                hurdles: results.hurdles,
                highJump: results.highJump,
                lap: results.lap
            })
            .onConflict((oc) => oc
                .column("zookid")
                .doUpdateSet({
                    sprint: results.sprint,
                    blockPush: results.blockPush,
                    hurdles: results.hurdles,
                    highJump: results.highJump,
                    lap: results.lap
                })
            )
            .execute();
    }
}

export default new AutoTrialsRepo();
