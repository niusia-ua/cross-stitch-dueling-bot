import { validate, parse } from "@telegram-apps/init-data-node";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const initData = new URLSearchParams(getQuery(event));
  try {
    validate(initData, config.BOT_TOKEN);
  } catch (error) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Invalid web app init data",
      cause: error,
    });
  }

  const userId = parse(initData).user?.id;
  if (!userId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Web app init data does not contain user information",
    });
  }

  const usersService = event.context.diContainerScope.resolve("usersService");
  const result = await usersService.getUserAndSettings(userId);
  if (!result) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
      message: "User not found or not authorized",
    });
  }

  await setUserSession(event, result);
  return result;
});
