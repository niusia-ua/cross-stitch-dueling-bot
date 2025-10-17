import { z } from "zod";

import { IdSchema } from "./utils.js";

export const UserSchema = z.object({
  id: IdSchema,
  username: z.coerce.string().max(32).nullable(),
  fullname: z.coerce.string().max(64 + 1 + 64),
  photoUrl: z.coerce.string().url().nullable(),
  active: z.coerce.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const UserDataSchema = UserSchema.pick({
  username: true,
  fullname: true,
  photoUrl: true,
  active: true,
});
export type UserData = z.infer<typeof UserDataSchema>;

export const UserIdAndFullnameSchema = UserSchema.pick({
  id: true,
  fullname: true,
});
export type UserIdAndFullname = z.infer<typeof UserIdAndFullnameSchema>;

export enum StitchesRate {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export const UserSettingsSchema = z.object({
  userId: IdSchema,
  stitchesRate: z.nativeEnum(StitchesRate),
  participatesInWeeklyRandomDuels: z.coerce.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const UserSettingsDataSchema = UserSettingsSchema.omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type UserSettingsData = z.infer<typeof UserSettingsDataSchema>;

export const UserAndSettingsSchema = z.object({
  user: UserSchema,
  settings: UserSettingsSchema,
});
export type UserAndSettings = z.infer<typeof UserAndSettingsSchema>;

export const UserAndSettingsDataSchema = z.object({
  user: UserDataSchema,
  settings: UserSettingsDataSchema,
});
export type UserAndSettingsData = z.infer<typeof UserAndSettingsDataSchema>;

export const UserAvailableForDuelSchema = UserSchema.pick({
  id: true,
  fullname: true,
  photoUrl: true,
}).merge(
  UserSettingsSchema.pick({
    stitchesRate: true,
  }),
);
export type UserAvailableForDuel = z.infer<typeof UserAvailableForDuelSchema>;
