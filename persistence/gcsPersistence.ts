import { Storage } from '@google-cloud/storage';

const ZOOK = 'zook';
const ZOOKS = `${ZOOK}s`;
const IMAGE = 'image.png';

const googleCredentialsString = Deno.env.get('GOOGLE_CREDENTIALS')
if (!googleCredentialsString) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
}

const storage = new Storage({
    credentials: JSON.parse(googleCredentialsString),
});

const bucketNameString = Deno.env.get('BUCKET_NAME')
if (!bucketNameString) {
    throw new Error('BUCKET_NAME environment variable is not set');
}

const bucket = storage.bucket(bucketNameString);

function getImagePath(id: string): string {
    return `${ZOOKS}/${id}/${IMAGE}`;
}

function getZookPath(id: string, zookName: string): string {
    return `${ZOOKS}/${id}/${zookName}.${ZOOK}`;
}

async function writeImage(id: string, imageBytes: Uint8Array): Promise<void> {
    const file = bucket.file(getImagePath(id));
    await file.save(imageBytes);
}

async function writeZook(id: string, zookName: string, zookBytes: Uint8Array): Promise<void> {
    const file = bucket.file(getZookPath(id, zookName));
    await file.save(zookBytes);
}

async function deleteZookAndImage(id: string, zookName: string): Promise<void> {
    const zookFile = bucket.file(getZookPath(id, zookName));
    const imageFile = bucket.file(getImagePath(id));

    await Promise.all([
        zookFile.delete().catch(() => { }), // Ignore errors if file doesn't exist
        imageFile.delete().catch(() => { }), // Ignore errors if file doesn't exist
    ]);
}

export async function writeZookAndImage(id: string, zookName: string, zookBytes: Uint8Array, imageBytes: Uint8Array): Promise<void> {
    try {
        await writeZook(id, zookName, zookBytes);
        await writeImage(id, imageBytes);
    } catch (error) {
        console.error(`Failed to write Zook and Image for ID ${id}:`, error);
        await deleteZookAndImage(id, zookName); // Clean up in case of error
        throw error; // Re-throw the error to be handled by the caller
    }
}

function getZookFilePath(id: string, zookFileName: string): string {
    return `${ZOOKS}/${id}/${zookFileName}`;
}

export async function getZookFile(id: string, zookFileName: string): Promise<Uint8Array | undefined> {
    const file = bucket.file(getZookFilePath(id, zookFileName));
    const [exists] = await file.exists();
    if (!exists) {
        return undefined; // Zook file does not exist
    }

    const [contents] = await file.download();
    return contents; // Return the downloaded Zook bytes
}
