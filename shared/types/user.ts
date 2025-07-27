import { z } from "zod";

export const TelegramUserIdSchema = z.coerce.number().int().positive();

export const UserSchema = z.object({
  id: TelegramUserIdSchema,
  username: z.coerce.string().max(32).nullable(),
  fullname: z.coerce.string().max(64 + 1 + 64),
  photoUrl: z.coerce.string().url().nullable(),
  active: z.coerce.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export const UserDataSchema = UserSchema.omit({
  active: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type UserData = z.infer<typeof UserDataSchema>;

export enum StitchesRate {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export const UserSettingsSchema = z.object({
  userId: TelegramUserIdSchema,
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
