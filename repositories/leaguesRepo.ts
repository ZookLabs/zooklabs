import client from "../db/database.ts"

class LeaguesRepo {

    async getLeader(trial: string): Promise<number> {
        const result = await client.queryObject<{zookid: number}>({
          text: `select zookid from ${trial} where position = 1`
        });
        return result.rows[0].zookid
      }
}

export default new LeaguesRepo();
