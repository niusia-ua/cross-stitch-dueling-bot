import type { User as UserType } from "./types/users.js";

declare module "#auth-utils" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends UserType {}

  interface UserSession {
    settings?: UserSettings;
  }
}

export {};
