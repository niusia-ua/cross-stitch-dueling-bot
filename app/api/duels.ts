import z from "zod";

export async function getDuelsRating() {
  const data = await $fetch("/api/duels/rating");
  return await DuelsRatingWithUsersInfoSchema.array().parseAsync(data);
}

export async function getActiveDuels() {
  const data = await $fetch("/api/duels/active");
  return await ActiveDuelRecordSchema.array().parseAsync(data);
}

export async function getArchivedDuels(year: number, month: number) {
  const data = await $fetch("/api/duels/archive", {
    query: { year, month },
  });
  return await ArchivedDuelRecordSchema.array().parseAsync(data);
}

export async function getAvailableUsersForDuel(excludeUserId?: number) {
  const data = await $fetch("/api/duels/users/available", {
    query: { excludeUserId },
  });
  return await UserAvailableForDuelSchema.array().parseAsync(data);
}

export async function getUserDuelParticipation(query?: { userId?: number; duelId?: number }) {
  const data = await $fetch("/api/duels/participation", { query });
  const { participation } = await z.object({ participation: z.boolean() }).parseAsync(data);
  return participation;
}

export async function sendDuelRequests(toUserIds: number[]) {
  await $fetch("/api/duels/requests", {
    method: "POST",
    body: toUserIds,
  });
}

export async function getUserDuelRequests() {
  const data = await $fetch("/api/duels/requests");
  return await UserDuelRequestSchema.array().parseAsync(data);
}

export async function handleDuelRequest(requestId: number, action: DuelRequestAction) {
  await $fetch(`/api/duels/requests/${requestId}/${action}`, {
    method: "POST",
  });
}

export async function sendDuelReport(duelId: number, report: DuelReportRequest) {
  const formData = new FormData();
  report.photos.forEach((photo) => formData.append("photos", photo));
  formData.append("stitches", report.stitches.toString());
  if (report.additionalInfo) formData.append("additionalInfo", report.additionalInfo);

  await $fetch(`/api/duels/${duelId}/report`, {
    method: "POST",
    body: formData,
  });
}
