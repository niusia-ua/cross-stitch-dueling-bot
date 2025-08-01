import { CloudTasksClient } from "@google-cloud/tasks";
import { ChannelCredentials } from "google-gax";

import type { TaskQueue } from "~~/server/types.js";

export class GoogleCloudTasksService {
  #client: CloudTasksClient;

  #projectId: string;
  #location: string;
  #handlerBaseUrl: string;

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
    this.#handlerBaseUrl = config.GOOGLE_CLOUD_TASKS_HANDLER_BASE_URL;
  }

  async createTask(queue: TaskQueue, payload?: unknown, options?: CreateTaskOptions) {
    await this.#client.createTask({
      parent: this.#client.queuePath(this.#projectId, this.#location, queue),
      task: {
        httpRequest: {
          url: new URL(queue, this.#handlerBaseUrl).toString(),
          httpMethod: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload !== undefined ? Buffer.from(JSON.stringify(payload)) : undefined,
        },
        scheduleTime: options?.delay !== undefined ? { seconds: (Date.now() + options.delay) / 1000 } : undefined,
      },
    });
  }
}

export interface CreateTaskOptions {
  /** The time in milliseconds to delay the task. */
  delay?: number;
}
