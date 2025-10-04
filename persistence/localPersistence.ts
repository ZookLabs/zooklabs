import { Persistence } from "./types.ts"

// Avoid remote std imports to satisfy linting rules in this workspace.
// Use simple helpers based on Deno built-ins.

function join(...parts: string[]) {
  return parts.join("/")
}

const ZOOK = "zook"
const ZOOKS = `${ZOOK}s`
const IMAGE = "image.png"

function getImagePath(id: string): string {
  return join(ZOOKS, id, IMAGE)
}

function getZookPath(id: string, zookName: string): string {
  return join(ZOOKS, id, `${zookName}.${ZOOK}`)
}

export class LocalPersistence implements Persistence {
  private baseDir: string

  constructor(baseDir = ".persistence") {
    this.baseDir = baseDir
  }

  private async ensureParent(dirPath: string) {
    // ensureDir equivalent using Deno
    const full = join(this.baseDir, dirPath)
    await Deno.mkdir(full, { recursive: true }).catch(() => {
      // If directory already exists ignore the error
    })
  }

  async writeZookAndImage(
    id: string,
    zookName: string,
    zookBytes: Uint8Array,
    imageBytes: Uint8Array,
  ): Promise<void> {
    const zookRel = getZookPath(id, zookName)
    const imageRel = getImagePath(id)
    await this.ensureParent(join(ZOOKS, id))

    const zookPath = join(this.baseDir, zookRel)
    const imagePath = join(this.baseDir, imageRel)

    try {
      await Deno.writeFile(zookPath, zookBytes)
      await Deno.writeFile(imagePath, imageBytes)
    } catch (err) {
      // cleanup on error
      try {
        await Deno.remove(zookPath)
      } catch (_removeErr) {
        // ignore remove errors
      }
      try {
        await Deno.remove(imagePath)
      } catch (_removeErr) {
        // ignore remove errors
      }
      throw err
    }
  }

  async getZookFile(
    id: string,
    zookFileName: string,
  ): Promise<Uint8Array | undefined> {
    const fileRel = join(ZOOKS, id, zookFileName)
    const filePath = join(this.baseDir, fileRel)
    try {
      const stat = await Deno.stat(filePath)
      if (!stat.isFile) return undefined
      return await Deno.readFile(filePath)
    } catch (_e) {
      return undefined
    }
  }
}
