import z from "zod";

import { IdSchema } from "./util.js";
import { UserSchema, UserSettingsSchema } from "./user.js";

export const DuelSchema = z.object({
  id: IdSchema,
  codeword: z.string(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
});
export type Duel = z.infer<typeof DuelSchema>;

export enum DuelRequestAction {
  Accept = "accept",
  Decline = "decline",
}
export const DuelRequestActionSchema = z.nativeEnum(DuelRequestAction);

export const DuelRequestSchema = z.object({
  id: IdSchema,
  fromUserId: IdSchema,
  toUserId: IdSchema,
  createdAt: z.coerce.date(),
});
export type DuelRequest = z.infer<typeof DuelRequestSchema>;

export const UserDuelRequestSchema = DuelRequestSchema.pick({
  id: true,
  createdAt: true,
}).merge(
  z.object({
    fromUser: UserSchema.pick({
      fullname: true,
      photoUrl: true,
    }),
  }),
);
export type UserDuelRequest = z.infer<typeof UserDuelRequestSchema>;

export const DuelParticipantSchema = z.object({
  duelId: IdSchema,
  userId: IdSchema,
});
export type DuelParticipant = z.infer<typeof DuelParticipantSchema>;

export const DuelWithParticipantsDataSchema = DuelSchema.pick({
  id: true,
  codeword: true,
  startedAt: true,
}).merge(
  z.object({
    participants: z.array(
      UserSchema.pick({
        id: true,
        fullname: true,
        photoUrl: true,
      }),
    ),
  }),
);
export type DuelWithParticipantsData = z.infer<typeof DuelWithParticipantsDataSchema>;

export const DuelReportSchema = z.object({
  duelId: IdSchema,
  userId: IdSchema,
  stitches: z.coerce.number().nonnegative(),
  additionalInfo: z.coerce.string().nullable(),
});
export type DuelReport = z.infer<typeof DuelReportSchema>;

export const DuelReportDataSchema = DuelReportSchema.pick({
  stitches: true,
  additionalInfo: true,
});
export type DuelReportData = z.infer<typeof DuelReportDataSchema>;

export const DuelReportPhotosSchema = z.object({
  photos: z.array(
    z.instanceof(File, { message: "Please select an image file." }).refine((file) => file.size <= 2 * 1024 * 1024, {
      message: "The image is too large. Please choose an image smaller than 2MB.",
    }),
  ),
});
export type DuelReportPhotos = z.infer<typeof DuelReportPhotosSchema>;

export const DuelReportRequestSchema = DuelReportDataSchema.merge(DuelReportPhotosSchema);
export type DuelReportRequest = z.infer<typeof DuelReportRequestSchema>;

export const DuelsRatingSchema = z.object({
  userId: IdSchema,
  totalDuelsWon: z.coerce.number().nonnegative(),
  totalDuelsParticipated: z.coerce.number().nonnegative(),
});
export type DuelsRating = z.infer<typeof DuelsRatingSchema>;

export const DuelsRatingWithUsersInfoSchema = DuelsRatingSchema.merge(
  z.object({
    user: UserSchema.pick({
      id: true,
      fullname: true,
      photoUrl: true,
    }).merge(UserSettingsSchema.pick({ stitchesRate: true })),
  }),
);
export type DuelsRatingWithUsersInfo = z.infer<typeof DuelsRatingWithUsersInfoSchema>;
