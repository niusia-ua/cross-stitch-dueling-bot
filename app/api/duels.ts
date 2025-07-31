import z from "zod";

export async function getActiveDuelsWithParticipants() {
  const data = await $fetch("/api/duels/active");
  return await z.array(DuelWithParticipantsDataSchema).parseAsync(data);
}

export async function getAvailableUsersForDuel(excludeUserId?: number) {
  const data = await $fetch("/api/duels/users/available", {
    query: { excludeUserId },
  });
  return await z.array(UserAvailableForDuelSchema).parseAsync(data);
}

export async function sendDuelRequests(toUserIds: number[]) {
  const data = await $fetch("/api/duels/requests", {
    method: "POST",
    body: toUserIds,
  });
  return await z.array(IdObjectSchema).parseAsync(data);
}

export async function getUserDuelRequests() {
  const data = await $fetch("/api/duels/requests");
  return await z.array(UserDuelRequestSchema).parseAsync(data);
}

export async function handleDuelRequest(requestId: number, action: DuelRequestAction) {
  await $fetch(`/api/duels/requests/${requestId}/${action}`, {
    method: "POST",
  });
}
