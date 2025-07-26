import z from "zod";

export async function validateWebAppData(initData: string) {
  const response = await $fetch(`/api/bot/validate-web-app-data?${initData}`);
  return z.object({ valid: z.boolean() }).parse(response);
}
