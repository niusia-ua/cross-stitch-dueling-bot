export async function createUser(id: number, user: Omit<UserData, "active">, settings: UserSettingsData) {
  const data = await $fetch(`/api/users/${id}`, {
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

export async function updateUser(id: number, user: Partial<UserData>) {
  const data = await $fetch(`/api/users/${id}`, {
    method: "PATCH",
    body: user,
  });
  return await UserSchema.parseAsync(data);
}

export async function updateUserSettings(id: number, settings: Partial<UserSettingsData>) {
  const data = await $fetch(`/api/users/${id}/settings`, {
    method: "PATCH",
    body: settings,
  });
  return await UserSettingsSchema.parseAsync(data);
}
