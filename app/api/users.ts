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

export async function updateUser(id: number, user: Omit<UserData, "id">) {
  const data = await $fetch(`/api/users/${id}`, {
    method: "PATCH",
    body: user,
  });
  return await UserSchema.parseAsync(data);
}

export async function updateUserSettings(id: number, settings: UserSettingsData) {
  const data = await $fetch(`/api/users/${id}/settings`, {
    method: "PATCH",
    body: settings,
  });
  return await UserSettingsSchema.parseAsync(data);
}
