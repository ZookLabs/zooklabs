import client from "../db/database.ts"
import {
  UserIdentifier,
  ZookEntity,
  ZookIdentifier,
  ZookTrial,
} from "../types.ts"

class ZookRepo {
  async list(): Promise<Array<ZookIdentifier>> {
    const result = await client.queryObject<ZookIdentifier>(
      "SELECT id, name FROM zook ORDER BY id DESC",
    )
    return result.rows
  }

  async getEntity(id: number): Promise<ZookEntity> {
    const result = await client.queryObject<ZookEntity>({
      text: `SELECT id,
                    name,
                    height,
                    length,
                    width,
                    weight,
                    components,
                    dateCreated  as datecreated,
                    dateUploaded as dateuploaded,
                    owner,
                    downloads,
                    views
              FROM zook
              WHERE id = $1`,
      args: [id],
    })
    return result.rows[0]
  }

  async getEntityIncreaseViews(zookId: number): Promise<ZookEntity> {
    const result = await client.queryObject<ZookEntity>({
      text: `UPDATE zook
             SET views = views + 1
             WHERE id = $1
             RETURNING id,
                 name,
                 height,
                 length,
                 width,
                 weight,
                 components,
                 dateCreated as datecreated,
                 dateUploaded as dateuploaded,
                 owner,
                 downloads,
                 views`,
      args: [zookId],
    })
    return result.rows[0]
  }

  async getOwner(ownerId?: number): Promise<UserIdentifier> {
    const result = await client.queryObject<UserIdentifier>({
      text: `SELECT username from users where id = $1`,
      args: [ownerId],
    })
    return result.rows[0]
  }

  async getTrial(trial: string, zookId: number): Promise<ZookTrial> {
    const result = await client.queryObject<ZookTrial>({
      text: "SELECT score, position, disqualified FROM " + trial +
        " where zookid = $1",
      args: [zookId],
    })
    return result.rows[0]
  }
}

export default new ZookRepo()
