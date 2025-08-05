import { Storage, type Bucket } from "@google-cloud/storage";
import { extension as getMimeTypeExtension } from "mime-types";

const DUEL_REPORTS_BUCKET_NAME = "duel-reports";

export class GoogleCloudStorageService {
  #client: Storage;

  #duelReportsBucket: Bucket;

  constructor() {
    const config = useRuntimeConfig();

    if (import.meta.dev) {
      // In development mode, connect to a local emulator.
      this.#client = new Storage({
        projectId: config.GOOGLE_CLOUD_PROJECT_ID,
        apiEndpoint: "http://localhost:4443",
      });
    } else {
      // In production mode, connect to the actual Google Cloud Storage service using default credentials.
      this.#client = new Storage({
        projectId: config.GOOGLE_CLOUD_PROJECT_ID,
      });
    }

    this.#duelReportsBucket = this.#client.bucket(DUEL_REPORTS_BUCKET_NAME);
  }

  /**
   * Uploads duel report photos to Google Cloud Storage.
   * @param duelId The ID of the duel.
   * @param userId The ID of the user who is uploading the report.
   * @param files An array of File objects representing the photos to upload.
   */
  async uploadDuelReportPhotos(duelId: number, userId: number, files: File[]) {
    // Delete previous files.
    await this.deleteDuelReportPhotos(duelId, userId);

    // Upload new files.
    await Promise.all(
      files.map(async (file, index) => {
        const destPath = `${duelId}/${userId}/${index}.${getMimeTypeExtension(file.type)}`;
        await this.#duelReportsBucket.file(destPath).save(await file.bytes());
      }),
    );
  }

  /**
   * Downloads duel report photos from Google Cloud Storage.
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
        return buffer;
      }),
    );
  }

  async deleteDuelReportPhotos(duelId: number, userId: number) {
    await this.#duelReportsBucket.deleteFiles({ prefix: `${duelId}/${userId}/` });
  }
}
