import { Persistence } from "./types.ts"
import { LocalPersistence } from "./localPersistence.ts"
import { createGcsPersistence } from "./gcsPersistence.ts"

// Returns a Persistence implementation based on env flag USE_LOCAL_PERSISTENCE
export async function makePersistence(): Promise<Persistence> {
  const useLocal = Deno.env.get("USE_LOCAL_PERSISTENCE") === "true"
  if (useLocal) return new LocalPersistence()
  return await createGcsPersistence()
}

// Convenience: eager singleton
let singleton: Promise<Persistence> | null = null
export function getPersistence(): Promise<Persistence> {
  if (!singleton) singleton = makePersistence()
  return singleton
}
