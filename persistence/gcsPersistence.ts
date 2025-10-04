import { Persistence } from "./types.ts"
// LocalPersistence is consumed by the central factory (persistence/persistence.ts)

const ZOOK = "zook"
const ZOOKS = `${ZOOK}s`
const IMAGE = "image.png"

export async function createGcsPersistence(): Promise<Persistence> {
  // Dynamic import avoids executing node-specific code at module load time in Deno.
  let Storage: unknown
  try {
    // Use npm specifier; Deno will resolve via npm if configured.
    const mod = await import("@google-cloud/storage")
    Storage = mod.Storage ?? mod.default ?? mod
  } catch (err) {
    throw new Error(
      "Failed to import @google-cloud/storage. If you're running locally in Deno set USE_LOCAL_PERSISTENCE=true or ensure npm deps are available. Original error: " +
        String(err),
    )
  }

  const googleCredentialsString = Deno.env.get("GOOGLE_CREDENTIALS")
  if (!googleCredentialsString) {
    throw new Error("GOOGLE_CREDENTIALS environment variable is not set")
  }

  const StorageCtor = Storage as unknown as {
    new (opts: unknown): Record<string, unknown>
  }
  const storage = new StorageCtor({
    credentials: JSON.parse(googleCredentialsString),
  })

  const bucketNameString = Deno.env.get("BUCKET_NAME")
  if (!bucketNameString) {
    throw new Error("BUCKET_NAME environment variable is not set")
  }

  const storageTyped = storage as unknown as {
    bucket(name: string): {
      file(path: string): {
        save(data: Uint8Array): Promise<unknown>
        delete(): Promise<unknown>
        exists(): Promise<[boolean]>
        download(): Promise<[Uint8Array]>
      }
    }
  }

  const bucket = storageTyped.bucket(bucketNameString)

  function getImagePath(id: string): string {
    return `${ZOOKS}/${id}/${IMAGE}`
  }

  function getZookPath(id: string, zookName: string): string {
    return `${ZOOKS}/${id}/${zookName}.${ZOOK}`
  }

  function getZookFilePath(id: string, zookFileName: string): string {
    return `${ZOOKS}/${id}/${zookFileName}`
  }

  return {
    async writeZookAndImage(
      id: string,
      zookName: string,
      zookBytes: Uint8Array,
      imageBytes: Uint8Array,
    ) {
      const zookFile = bucket.file(getZookPath(id, zookName))
      const imageFile = bucket.file(getImagePath(id))

      try {
        await zookFile.save(zookBytes)
        await imageFile.save(imageBytes)
      } catch (error) {
        console.error(`Failed to write Zook and Image for ID ${id}:`, error)
        await Promise.all([
          zookFile.delete().catch(() => {}),
          imageFile.delete().catch(() => {}),
        ])
        throw error
      }
    },

    async getZookFile(id: string, zookFileName: string) {
      const file = bucket.file(getZookFilePath(id, zookFileName))
      const [exists] = await file.exists()
      if (!exists) return undefined

      const [contents] = await file.download()
      return contents
    },
  }
}
