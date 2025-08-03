import { Storage } from "@google-cloud/storage";
import { extension as getMimeTypeExtension } from "mime-types";

export class GoogleCloudStorageService {
  #client: Storage;

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
  }

  /**
   * Uploads duel report photos to Google Cloud Storage.
   * @param duelId The ID of the duel.
   * @param userId The ID of the user who is uploading the report.
   * @param files An array of File objects representing the photos to upload.
   * Each file will be saved to the `:duelId/:userId/index.extension` file, where `index` is the position of the file in the array and `extension` is the file's extension.
   * @returns An array of URLs pointing to the uploaded files.
   */
  async uploadDuelReportPhotos(duelId: number, userId: number, files: File[]) {
    return await Promise.all(
      files.map(async (file, index) => {
        const destPath = `${duelId}/${userId}/${index}.${getMimeTypeExtension(file.type)}`;
        await this.#client
          .bucket("duel-reports")
          .file(destPath)
          .save(await file.bytes(), { public: true });
        return `${this.#client.apiEndpoint}/duel-reports/${destPath}`;
      }),
    );
  }
}
