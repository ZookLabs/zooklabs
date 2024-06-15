import usersRepo from "../repositories/usersRepo.ts"

export const listUsers = async () => {
  return await usersRepo.list()
}