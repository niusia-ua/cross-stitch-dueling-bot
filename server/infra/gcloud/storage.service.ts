import { type Bucket, Storage } from "@google-cloud/storage";
import { extension as getMimeTypeExtension } from "mime-types";

const DUEL_REPORTS_BUCKET_NAME = "duel-reports";

export class GoogleCloudStorageService {
  #client: Storage;

  #duelReportsBucket: Bucket;

  constructor() {
    const config = useRuntimeConfig();

    if (config.gcloud.useEmulators) {
      this.#client = new Storage({
        projectId: config.gcloud.projectId,
        apiEndpoint: "http://localhost:4443",
      });
    } else {
      this.#client = new Storage({
        projectId: config.gcloud.projectId,
      });
    }

    this.#duelReportsBucket = this.#client.bucket(DUEL_REPORTS_BUCKET_NAME);
  }

  /**
   * Uploads duel report photos to the storage.
   * @param duelId The ID of the duel.
   * @param userId The ID of the user who is uploading the report.
   * @param files An array of File objects representing the photos to upload.
   */
  async uploadDuelReportPhotos(duelId: number, userId: number, files: File[]) {
    try {
      // Delete previous files.
      await this.deleteUserDuelReportPhotos(duelId, userId);
    } catch (error) {
      console.error("Failed to delete previous duel report photos:", error);
    }

    // Upload new files.
    return await Promise.all(
      files.map(async (file, index) => {
        const destPath = `${duelId}/${userId}/${index}.${getMimeTypeExtension(file.type)}`;

        const buffer = await file.bytes();
        await this.#duelReportsBucket.file(destPath).save(buffer);

        return buffer;
      }),
    );
  }

  /**
   * Downloads duel report photos from the storage.
   * @param duelId The ID of the duel.
   * @param userId The ID of the user who uploaded the report.
   * @returns An array of Buffers containing the downloaded photos data.
   */
  async downloadDuelReportPhotos(duelId: number, userId: number) {
    // Get all files in the specified directory.
    const [files] = await this.#duelReportsBucket.getFiles({ prefix: `${duelId}/${userId}/` });

    // Download each file and return its content as a Buffer.
    return await Promise.all(
      files.map(async (file) => {
        const [buffer] = await file.download();
        return Uint8Array.from(buffer);
      }),
    );
  }

  /**
   * Deletes all report photos from the storage.
   * @param duelId The ID of the duel.
   */
  async deleteDuelReportPhotos(duelId: number) {
    const prefix = `${duelId}/`;
    await this.#duelReportsBucket.deleteFiles({ prefix });
    await this.#duelReportsBucket.file(prefix).delete();
  }

  /**
   * Deletes user's duel report photos from the storage.
   * @param duelId The ID of the duel.
   * @param userId The ID of the user..
   */
  async deleteUserDuelReportPhotos(duelId: number, userId: number) {
    await this.#duelReportsBucket.deleteFiles({ prefix: `${duelId}/${userId}/` });
  }
}
