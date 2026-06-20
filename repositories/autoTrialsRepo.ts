import db from "../db/db.ts"
import {AutoTrialResults} from "../db/schema.ts";


class AutoTrialsRepo {

    async getAutoTrialResults(zookId: number): Promise<AutoTrialResults | undefined> {
        return await db.selectFrom("auto_trial_results")
            .selectAll()
            .where("zookId", "=", zookId)
            .executeTakeFirst();
    }

    async addAutoTrialResults(results: AutoTrialResults): Promise<void> {
        await db.insertInto("auto_trial_results")
            .values(results)
            .onConflict((oc) => oc
                .column("zookId")
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