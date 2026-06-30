import { Context, Status } from "oak"
import { addAutoTrialResults } from "../services/autoTrialsService.ts"
import usersRepo from "../repositories/usersRepo.ts"
import { getAuthUser } from "./helpers.ts"

export default async (urlId: string, context: Context) => {
    const authUser = getAuthUser(context)
    if (!authUser) {
        context.response.status = Status.Unauthorized
        return
    }

    const isAdmin = await usersRepo.isUserAdmin(authUser.id)
    if (!isAdmin) {
        context.response.status = Status.Unauthorized
        return
    }

    const zookId: number = parseInt(urlId)
    if (isNaN(zookId)) {
        context.response.status = Status.BadRequest
        return
    }

    try {
        const body = context.request.body()
        if (body.type !== "json") {
            context.response.status = Status.BadRequest
            return
        }

        const results = await body.value
        
        // Basic validation of the payload
        const { sprint, blockPush, hurdles, highJump, lap } = results
        if (
            typeof sprint !== "number" ||
            typeof blockPush !== "number" ||
            typeof hurdles !== "number" ||
            typeof highJump !== "number" ||
            typeof lap !== "number"
        ) {
            context.response.status = Status.BadRequest
            context.response.body = { error: "Invalid trial results data. All values must be numbers." }
            return
        }

        await addAutoTrialResults({
            zookId,
            sprint,
            blockPush,
            hurdles,
            highJump,
            lap
        })

        context.response.status = Status.Created
        context.response.body = { message: "Auto trial results added successfully" }
    } catch (e) {
        console.error(e)
        context.response.status = Status.InternalServerError
    }
}
