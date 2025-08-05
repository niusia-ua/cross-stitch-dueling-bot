import { CloudTasksClient } from "@google-cloud/tasks";
import { ChannelCredentials } from "google-gax";

import { DUEL_PERIOD, DUEL_REQUEST_VALIDITY_PERIOD } from "#shared/constants/duels.js";

export class GoogleCloudTasksService {
  #client: CloudTasksClient;

  #projectId: string;
  #location: string;

  #baseUrl: string;

  constructor() {
    if (import.meta.dev) {
      // In development mode, connect to a local emulator.
      this.#client = new CloudTasksClient({
        port: 8123,
        servicePath: "localhost",
        sslCreds: ChannelCredentials.createInsecure(),
      });
    } else {
      // In production mode, connect to the actual Google Cloud Tasks service using default credentials.
      this.#client = new CloudTasksClient();
    }

    const config = useRuntimeConfig();
    this.#projectId = config.GOOGLE_CLOUD_PROJECT_ID;
    this.#location = config.GOOGLE_CLOUD_TASKS_LOCATION;
    this.#baseUrl = config.APP_URL;
  }

  /**
   * Creates a task in the specified queue with the given payload.
   * @param queue The name of the queue to create the task in.
   * @param endpoint The endpoint to call when the task is executed.
   * @param payload The payload to include in the task.
   * @param options Options for creating the task.
   */
  async #createTask(
    queue: string,
    endpoint: string,
    payload: unknown,
    options?: {
      /** The time in milliseconds to delay the task. */
      delay?: number;
    },
  ) {
    await this.#client.createTask({
      parent: this.#client.queuePath(this.#projectId, this.#location, queue),
      task: {
        httpRequest: {
          url: new URL(`/api/tasks/${endpoint}`, this.#baseUrl).toString(),
          httpMethod: "POST",
          headers: { "Content-Type": "application/json" },
          body: Buffer.from(JSON.stringify(payload)),
        },
        scheduleTime: options?.delay !== undefined ? { seconds: (Date.now() + options.delay) / 1000 } : undefined,
      },
    });
  }

  /**
   * Schedules a task to cancel a duel request after the period of validity.
   * @param id The ID of the duel request to cancel.
   */
  async scheduleDuelRequestCancellation(id: number) {
    await this.#createTask(
      "duel-request-cancellation",
      "cancel-duel-request",
      { id },
      { delay: DUEL_REQUEST_VALIDITY_PERIOD },
    );
  }

  /**
   * Schedules a task to complete a duel after the duel period.
   * @param id The ID of the duel to complete.
   */
  async scheduleDuelCompletion(id: number) {
    await this.#createTask("duel-completion", "complete-duel", { id }, { delay: DUEL_PERIOD });
  }
}
