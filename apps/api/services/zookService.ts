import zookRepo from "../repositories/zookRepo.ts"
import { ZookContainer } from "../types.ts"

export const listZooks = async () => await zookRepo.list()

export const getZook = async (id: number, increaseViews: boolean) =>
  await zookRepo.getZook(id, increaseViews)

export const persistZook = async (
  zookContainer: ZookContainer,
  transactionalFunction: (zookId: number) => Promise<void>,
) => await zookRepo.persistZook(zookContainer, transactionalFunction)
