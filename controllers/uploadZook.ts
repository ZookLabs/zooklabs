import { Blowfish } from "blowfish"
import { Ecb } from "block-modes"
import { decodeHex } from "@std/encoding/hex"
import { BodyFormData, Context, FormDataBody, Status } from "oak"
import { parse, xml_document } from "xml"

import { gunzip } from "jsr:@deno-library/compress"

import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts"
import { AuthUser, ZookContainer, ZookEntity, ZookTrial } from "../types.ts"
import { stringToLocalDate } from "../util/dateParser.ts"
import { getAuthUser } from "./helpers.ts"
import { persistZook } from "../services/zookService.ts"
import { writeZookAndImage } from "../persistence/gcsPersistence.ts"

// Convert RGB hex string (e.g., "RRGGBBRRGGBB...") to Uint8ClampedArray with alpha added
function hexRgbToRgbaArray(hex: string): Uint8ClampedArray {
  if (hex.length % 6 !== 0) {
    throw new Error("RGB hex string must be divisible by 6")
  }

  const numPixels = hex.length / 6
  const rgba = new Uint8ClampedArray(numPixels * 4)

  for (let i = 0; i < numPixels; i++) {
    const offset = i * 6
    const r = parseInt(hex.slice(offset, offset + 2), 16)
    const g = parseInt(hex.slice(offset + 2, offset + 4), 16)
    const b = parseInt(hex.slice(offset + 4, offset + 6), 16)

    const idx = i * 4
    rgba[idx] = r
    rgba[idx + 1] = g
    rgba[idx + 2] = b
    rgba[idx + 3] = 255 // fully opaque alpha
  }

  return rgba
}

async function hexToPng(hex: string, width: number, height: number) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  const imageData = ctx.createImageData(width, height)
  imageData.data.set(hexRgbToRgbaArray(hex))
  ctx.putImageData(imageData, 0, 0)

  const buffer = await canvas.toBuffer("image/png")
  return buffer
}

const keyStringHex = Deno.env.get("ZOOK_CORE_KEY")
if (!keyStringHex) {
  throw new Error("ZOOK_CORE_KEY environment variable is not set")
}
const key = decodeHex(keyStringHex.replaceAll(" ", ""))
const blowfish = new Ecb(Blowfish, key)

const headerStringHex = Deno.env.get("ZOOK_CORE_HEADER")
if (!headerStringHex) {
  throw new Error("ZOOK_CORE_HEADER environment variable is not set")
}
const header = decodeHex(headerStringHex.replaceAll(" ", ""))

const maybeDiscordWebhook = Deno.env.get("DISCORD_WEBHOOK")
if (!maybeDiscordWebhook) {
  throw new Error("DISCORD_WEBHOOK environment variable is not set")
}
const discordWebhook = maybeDiscordWebhook

const zook = "zook"
const zookExt = `.${zook}`

// 100000 = 100kb
const onehundredKb = 100000

const textDecoder = new TextDecoder()

function trimTrailingNewlines(bytes: Uint8Array): Uint8Array {
  let len = bytes.length
  while (len > 0 && (bytes[len - 1] === 10 || bytes[len - 1] === 13)) {
    len--
  }
  return bytes.slice(0, len)
}

export const getZookFromRequest = async (
  context: Context,
) => {
  const contentLength = context.request.headers.get("Content-Length")
  if (
    !contentLength || isNaN(Number(contentLength)) ||
    Number(contentLength) > onehundredKb
  ) {
    context.response.status = Status.BadRequest
    context.response.body = "File Too Big"
    return undefined
  }

  const bodyform: BodyFormData = await context.request.body({
    type: "form-data",
  })
  const formDataBody: FormDataBody = await bodyform.value.read({
    maxFileSize: onehundredKb,
    maxSize: onehundredKb,
    bufferSize: onehundredKb,
  })

  const maybeZookFile = formDataBody.files?.find((file) => file.name === zook)
  if (!maybeZookFile) {
    context.response.status = Status.BadRequest
    context.response.body = "No zook form field"
    return
  }

  if (!maybeZookFile.originalName.endsWith(zookExt)) {
    context.response.status = Status.BadRequest
    context.response.body = `Not a .zook file`
    return
  }

  if (!maybeZookFile.content) {
    context.response.status = Status.BadRequest
    context.response.body = "No content in zook file"
    return
  }

  const zookBytesCleaned: Uint8Array<ArrayBufferLike> = trimTrailingNewlines(
    maybeZookFile.content,
  )
  return zookBytesCleaned
}

export const decodeZook = (
  context: Context,
  zookBytesCleaned: Uint8Array,
): string | undefined => {
  if (
    !zookBytesCleaned.slice(0, header.length).every((byte, index) =>
      byte === header[index]
    )
  ) {
    context.response.status = Status.BadRequest
    context.response.body = `Somethings wrong with that Zook!`
    return
  }

  // Remove the header
  const zookBytesDroppedHeader = zookBytesCleaned.slice(header.length)

  // Decrypt using Blowfish
  const zookBytesDecrypted = blowfish.decrypt(zookBytesDroppedHeader)

  // Unzip
  const zookBytesDecompressed = gunzip(zookBytesDecrypted)

  // Converted decrypted bytes to string
  const zookXml = textDecoder.decode(zookBytesDecompressed)
  return zookXml
}

export default async (context: Context) => {
  try {
    // Converted decrypted bytes to string

    const zookBytesCleaned = await getZookFromRequest(context)
    if (!zookBytesCleaned) {
      return
    }
    const zookXml = decodeZook(context, zookBytesCleaned)
    if (!zookXml) {
      return
    }

    const parsedZookXML: xml_document = parse(zookXml)

    const ownersRaw = parsedZookXML.zook.passport.ownership.owner
    const owners = Array.isArray(ownersRaw) ? ownersRaw : [ownersRaw]

    const zookName = owners.slice(-1)[0]["@zookname"]

    const adoptionDate = owners.slice(-1)[0]["@adoption_date"]

    const detailsRaw = parsedZookXML.zook.passport.details.detail
    const details = Array.isArray(detailsRaw) ? detailsRaw : [detailsRaw]

    const getPhysicalDetail = (name: string): number => {
      return Number(
        details.filter((detail) => detail["@name"] === name)[0]["@data"].trim(),
      )
    }

    const getZookTrial = (name: string): ZookTrial | undefined => {
      const maybeTrial = details.filter((detail) => detail["@name"] === name)[0]

      if (!maybeTrial) {
        return undefined
      }
      return {
        score: Number(maybeTrial["@data"].trim()),
        position: 2147483647,
        disqualified: false,
      }
    }

    const authUser = getAuthUser(context)

    const ownerId = authUser ? authUser.id : undefined

    const zookEntity: ZookEntity = {
      id: 0, // This will be set when persisting to the database
      name: zookName,
      height: getPhysicalDetail("Height"),
      length: getPhysicalDetail("Length"),
      width: getPhysicalDetail("Width"),
      weight: getPhysicalDetail("Weight"),
      components: getPhysicalDetail("Components"),
      datecreated: stringToLocalDate(adoptionDate),
      dateuploaded: new Date(), // Current date and time
      owner: ownerId,
      downloads: 0, // This will be set when persisting to the database
      views: 0, // This will be set when persisting to the database
    }

    const zookContainer: ZookContainer = {
      zook: zookEntity,
      sprint: getZookTrial("Trial: Sprint"),
      blockPush: getZookTrial("Trial: Block Push"),
      hurdles: getZookTrial("Trial: Hurdles"),
      highJump: getZookTrial("Trial: High Jump"),
      lap: getZookTrial("Trial: Lap"),
    }

    // Parse the image hex from the XML
    const imageHex: string = parsedZookXML.zook.photo_album.image["@image"]

    const imageHeaderHex = "0808080001000100"
    const imageHexNoHeader = imageHex.slice(imageHeaderHex.length)

    const pngBytes = await hexToPng(imageHexNoHeader, 256, 256)

    const zookId = await persistZook(zookContainer, (zookId: number) => {
      // Write zook image and zook to GCP bucket
      return writeZookAndImage(
        zookId.toString(),
        zookName,
        zookBytesCleaned,
        pngBytes,
      )
    })

    await sendDiscordWebhook(
      zookContainer.zook,
      authUser,
      zookId,
      pngBytes,
      discordWebhook,
    )

    context.response.body = {
      id: zookId,
    }
    context.response.status = Status.OK
  } catch (error) {
    console.error("Error in uploadZook controller:", error)
    context.response.status = Status.InternalServerError
    context.response.body = "Internal Server Error"
  }
}

// Define the DiscordWebhook structure
interface DiscordWebhook {
  embeds: Embed[]
}

interface Embed {
  title: string
  url: string
  color: number
  description?: string
  thumbnail: Thumbnail
  fields: Field[]
}

interface Thumbnail {
  url: string
}

interface Field {
  name: string
  value: string
  inline: boolean
}

// Function to create and send the Discord webhook
async function sendDiscordWebhook(
  zookEntity: ZookEntity,
  user: AuthUser | undefined,
  id: number,
  imageBytes: Uint8Array,
  discordWebhookUrl: string,
): Promise<void> {
  const embed: Embed = {
    title: zookEntity.name,
    url: `https://zooklabs.com/zooks/${id}`,
    color: 16725286,
    description: user?.username
      ? `__Uploaded By__:\n**${user.username}**`
      : undefined,
    thumbnail: { url: "attachment://image.png" },
    fields: [
      {
        name: "Physical",
        value: "Height\nLength\nWidth\nWeight\nComponents",
        inline: true,
      },
      {
        name: "Measurement",
        value: `${zookEntity.height} cm\n` +
          `${zookEntity.length} cm\n` +
          `${zookEntity.width} cm\n` +
          `${zookEntity.weight} kg\n` +
          `${zookEntity.components}`,
        inline: true,
      },
    ],
  }

  const webhookPayload: DiscordWebhook = {
    embeds: [embed],
  }

  const formData = new FormData()
  formData.append("payload_json", JSON.stringify(webhookPayload))
  formData.append(
    "file",
    new Blob([imageBytes], { type: "image/png" }),
    "image.png",
  )

  const response = await fetch(discordWebhookUrl, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorResponse = await response.json()
    console.error(
      `Request failed with status ${response.status} and DiscordError:`,
      errorResponse,
    )
    throw new Error("Problem posting to Discord")
  }
}
