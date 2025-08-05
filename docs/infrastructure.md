# Infrastructure Overview

In production, this project is hosted on Google Cloud Platform.

Thus, we use some GCP services:

- [Cloud Run](https://cloud.google.com/run/docs).
  It is a managed compute platform on which we run the application in a Docker container.

- [Cloud Storage](https://cloud.google.com/storage/docs).
  It is a managed storage service on which we store files (mainly, photos).

  Client library: [`@google-cloud/storage`](https://github.com/googleapis/nodejs-storage#readme).

- [Cloud Tasks](https://cloud.google.com/tasks/docs).
  It is a managed service which we use to schedule tasks that must be executed after some period of time.

  Client library: [`@google-cloud/tasks`](https://github.com/googleapis/google-cloud-node/tree/main/packages/google-cloud-tasks#readme).

The Cloud Storage and Cloud Tasks are emulated locally so that you don't need to set up a real project on GCP.
Check out the [Docker Compose file](../compose.yml) and the [Development Prerequisites](../README.md#prerequisites).
