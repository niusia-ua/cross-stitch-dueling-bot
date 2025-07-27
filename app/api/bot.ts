import z from "zod";

export async function validateWebAppData(initData: string) {
  const data = await $fetch(`/api/bot/validate-web-app-data?${initData}`);
  return await z.object({ valid: z.boolean() }).parseAsync(data);
}
