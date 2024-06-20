import usersRepo from "../repositories/usersRepo.ts"

export const listUsers = async () => {
  return await usersRepo.list()
}
export const getUser = async (username: string) => {
  return await usersRepo.getEntity(username)
}