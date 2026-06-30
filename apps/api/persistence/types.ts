export interface Persistence {
  writeZookAndImage(
    id: string,
    zookName: string,
    zookBytes: Uint8Array,
    imageBytes: Uint8Array,
  ): Promise<void>

  getZookFile(id: string, zookFileName: string): Promise<Uint8Array | undefined>
}
