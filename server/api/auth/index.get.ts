import * as twa from "@telegram-apps/init-data-node";
import jwt from "jsonwebtoken";

import { JWT_COOKIE_NAME } from "~~/server/constants.js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const initData = new URLSearchParams(getQuery(event));
  try {
    twa.validate(initData, config.BOT_TOKEN);
  } catch (error) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Invalid web app init data",
      cause: error,
    });
  }

  const userId = twa.parse(initData).user?.id;
  if (!userId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Web app init data does not contain user information",
    });
  }

  const usersService = event.context.diContainerScope.resolve("usersService");
  const result = await usersService.getUserWithSettings(userId);
  if (!result) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
      message: "User not found or not authorized",
    });
  }

  const token = jwt.sign({ userId: result.user.id }, config.JWT_SECRET);
  setCookie(event, JWT_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return result;
});
