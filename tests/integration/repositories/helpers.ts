import db from "../../../db/db.ts"
import usersRepo from "../../../repositories/usersRepo.ts"
import { UserEntity, ZookEntity } from "../../../types.ts"

export async function getAccountById(id: number) {
  return await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function insertUserWithUsername(
  user: UserEntity,
  username: string,
) {
  const persisted = await usersRepo.persistUser(user)
  await usersRepo.setUsername(persisted.id, username)
  return { ...persisted, username: username }
}

export async function insertTestZook(testZook: ZookEntity) {
  return await db
    .insertInto("zook")
    .values({
      name: testZook.name,
      height: testZook.height,
      length: testZook.length,
      width: testZook.width,
      weight: testZook.weight,
      components: testZook.components,
      datecreated: testZook.datecreated.toISOString(),
      dateuploaded: testZook.dateuploaded.toISOString(),
      owner: testZook.owner ?? null,
      downloads: testZook.downloads,
      views: testZook.views,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
}
