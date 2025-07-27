export async function createUser(user: UserData, settings: UserSettingsData) {
  const data = await $fetch("/api/users/", {
    method: "POST",
    body: { user, settings },
  });
  return await UserAndSettingsSchema.parseAsync(data);
}

export async function getUser(id: number) {
  const data = await $fetch(`/api/users/${id}`);
  if (data === undefined) return null;
  return await UserAndSettingsSchema.parseAsync(data);
}
