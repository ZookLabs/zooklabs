import { Transaction } from "postgres"
import client from "../db/database.ts"
import {
  ZookContainer,
  UserIdentifier,
  ZookEntity,
  ZookIdentifier,
  ZookTrial,
  TrialEntity,
  createTrialEntity
} from "../types.ts"
import {
  Trials
} from "./trialsEnum.ts"

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

  async incrementDownloads(zookId: number): Promise<void> {
    await client.queryObject({
      text: `UPDATE zook
             SET downloads = downloads + 1
             WHERE id = $1`,
      args: [zookId],
    });
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



  async persistTrialQuery(trials: Trials, trialEntity: TrialEntity, transaction: Transaction): Promise<void> {
    await transaction.queryArray({
      text: `INSERT INTO ${trials.value}
             (zookid, name, score, position, disqualified)
             VALUES ($1, $2, $3, $4, $5)`,
      args: [
        trialEntity.zookid,
        trialEntity.name,
        trialEntity.score,
        trialEntity.position,
        trialEntity.disqualified,
      ],
    });
  }


  async persistZookQuery(zookEntity: ZookEntity, transaction: Transaction): Promise<number> {
    const result = await transaction.queryArray<[number]>({
      text: `INSERT INTO zook
             (name, height, length, width, weight, components, dateCreated, dateUploaded, owner)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
      args: [
        zookEntity.name,
        zookEntity.height,
        zookEntity.length,
        zookEntity.width,
        zookEntity.weight,
        zookEntity.components,
        zookEntity.datecreated,
        zookEntity.dateuploaded,
        zookEntity.owner,
      ],
    });
    return result.rows[0][0];
  }


  async persistZook(zookContainer: ZookContainer, transactionalFunction: (zookId: number) => Promise<void>): Promise<number> {

    try {
      const transaction = client.createTransaction('persistZook')
      await transaction.begin();

      // Persist the Zook entity and get the generated ID
      const zookId = await this.persistZookQuery(zookContainer.zook, transaction);

      const toEntity = (zookTrial: ZookTrial): TrialEntity =>
        createTrialEntity(
          zookId,
          zookContainer.zook.name,
          zookTrial.score,
        );

      if (zookContainer.sprint) {
        await this.persistTrialQuery(Trials.Sprint, toEntity(zookContainer.sprint), transaction);
      }
      if (zookContainer.blockPush) {
        await this.persistTrialQuery(Trials.BlockPush, toEntity(zookContainer.blockPush), transaction);
      }
      if (zookContainer.hurdles) {
        await this.persistTrialQuery(Trials.Hurdles, toEntity(zookContainer.hurdles), transaction);
      }
      if (zookContainer.highJump) {
        await this.persistTrialQuery(Trials.HighJump, toEntity(zookContainer.highJump), transaction);
      }
      if (zookContainer.lap) {
        await this.persistTrialQuery(Trials.Lap, toEntity(zookContainer.lap), transaction);
      }

      await transactionalFunction(zookId);

      await transaction.commit();

      return zookId;
    } catch (error) {
      console.error("Error persisting Zook:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }


  async setOwner(zookId: number, ownerId: number): Promise<void> {
    await client.queryArray({
      text: `UPDATE zook
               SET owner = $1
               WHERE id = $2`,
      args: [ownerId, zookId],
    });
  }

}
export default new ZookRepo()
