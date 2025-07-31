import z from "zod";

import { IdSchema } from "./util.js";
import { UserSchema } from "./user.js";

export enum DuelStatus {
  Active = "active",
  Completed = "completed",
}

export const DuelSchema = z.object({
  id: IdSchema,
  codeword: z.string(),
  status: z.nativeEnum(DuelStatus),
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
