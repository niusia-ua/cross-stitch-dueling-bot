export async function auth(initData: string) {
  const data = await $fetch(`/api/auth?${initData}`);
  return await UserAndSettingsSchema.parseAsync(data);
}
