import { CloudTasksClient } from "@google-cloud/tasks";
import { OAuth2Client, type LoginTicket } from "google-auth-library";
import { ChannelCredentials } from "google-gax";

export class GoogleCloudTasksService {
  #config = useRuntimeConfig();

  #tasksClient: CloudTasksClient;
  #oauthClient: OAuth2Client;

  constructor() {
    if (this.#config.gcloud.useEmulators) {
      this.#tasksClient = new CloudTasksClient({
        port: 8123,
        servicePath: "localhost",
        sslCreds: ChannelCredentials.createInsecure(),
      });
      this.#oauthClient = new OAuth2Client({
        issuers: ["http://localhost:8980"],
        endpoints: {
          // oauth2FederatedSignonPemCertsUrl: "http://localhost:8980/certs",
          oauth2FederatedSignonJwkCertsUrl: "http://localhost:8980/jwks",
        },
      });
    } else {
      this.#tasksClient = new CloudTasksClient();
      this.#oauthClient = new OAuth2Client();
    }
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
    await this.#tasksClient.createTask({
      parent: this.#tasksClient.queuePath(this.#config.gcloud.projectId, this.#config.gcloud.tasksLocation, queue),
      task: {
        httpRequest: {
          url: new URL(`/api/tasks/${endpoint}`, this.#config.appUrl).toString(),
          httpMethod: "POST",
          headers: { "Content-Type": "application/json" },
          body: Buffer.from(JSON.stringify(payload)),
          oidcToken: { serviceAccountEmail: this.#config.gcloud.serviceAccountEmail },
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
      { delay: this.#config.public.duelRequestValidityPeriod },
    );
  }

  /**
   * Schedules a task to complete a duel after the duel period.
   * @param id The ID of the duel to complete.
   * @param options Options for scheduling the task.
   */
  async scheduleDuelCompletion(
    id: number,
    options?: {
      /** An additional delay in milliseconds before the duel is completed. */
      delay?: number;
    },
  ) {
    await this.#createTask(
      "duel-completion",
      "complete-duel",
      { id },
      { delay: this.#config.public.duelPeriod + (options?.delay ?? 0) },
    );
  }

  /**
   * Schedules a task to remind a user about a duel report.
   * @param duelId The ID of the duel to report.
   * @param userId The ID of the user to remind.
   */
  async scheduleDuelReportReminder(duelId: number, userId: number) {
    await Promise.all(
      this.#config.public.duelReportReminderTimeouts.map((delay) =>
        this.#createTask("duel-report-reminder", "remind-user-about-duel-report", { duelId, userId }, { delay }),
      ),
    );
  }

  /**
   * Schedules a task to delete report images.
   * @param duelId The ID of the duel whose report images should be deleted.
   */
  async scheduleReportImagesCleanup(duelId: number) {
    await this.#createTask(
      "report-images-cleanup",
      "delete-report-images",
      { id: duelId },
      { delay: this.#config.public.reportImagesCleanupDelay },
    );
  }

  /**
   * Validates an ID token for authorized endpoints.
   * @param idToken The ID token to validate.
   * @returns A promise that resolves to the decoded token if valid, or rejects with an error.
   */
  async validateToken(idToken: string) {
    // Due to this issue, it is impossible to validate the token in development.
    // https://github.com/aertje/cloud-tasks-emulator/issues/99
    if (import.meta.dev) return {} as unknown as LoginTicket;

    const endpoints = [
      "cancel-duel-request",
      "complete-duel",
      "remind-user-about-duel-report",
      "create-weekly-random-duels",
      "publish-monthly-rating-and-winners",
      "delete-report-images",
    ];
    return await this.#oauthClient.verifyIdToken({
      idToken,
      audience: endpoints.map((endpoint) => new URL(`/api/tasks/${endpoint}`, this.#config.appUrl).toString()),
    });
  }
}
