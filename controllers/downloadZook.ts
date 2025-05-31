import { Context, Status } from "oak";
import zookrepo from "../repositories/zookRepo.ts"
import { getZookFile } from "../persistence/gcsPersistence.ts"

export async function downloadZook(zookId: string, zookName: string, context: Context) {

    const id = parseInt(zookId, 10);
    if (isNaN(id) || id <= 0) { // Ensure id is a valid positive integer
        context.response.status = Status.BadRequest
        context.response.body = "Invalid zook ID"
        return
    }

    try {
        const zookFile = await getZookFile(id.toString(), zookName)

        if (!zookFile) {
            context.response.status = Status.NotFound;
            return;
        }

        context.response.status = Status.OK;
        context.response.headers.set("Content-Type", "application/bamzooki");
        context.response.headers.set(
            "Content-Disposition",
            `form-data; name="${zookName}"; filename="${zookName}"`
        );

        const cookieId = `zd_${id}`;
        const hasDownloaded = await context.cookies.has(cookieId);

        if (!hasDownloaded) {
            await context.cookies.set(cookieId, " ", {
                domain: "zooklabs.com",
                maxAge: 60 * 60 * 24,
                httpOnly: true,
                // secure: true,
                // sameSite: "none",
            })

            // Simulate incrementing downloads in a repository
            await zookrepo.incrementDownloads(id);
        }

        context.response.body = zookFile;
        context.response.headers.set("Content-Length", zookFile.length.toString());
    } catch (error) {
        console.error(`Failed to download zook with ID ${id} and name ${zookName}:`, error);
        context.response.status = Status.InternalServerError;
    }
}
