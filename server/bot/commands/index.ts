import { Composer } from "grammy";
import type { BotContext } from "../types.js";

import { commonCommands } from "./common.js";

export const commands = new Composer<BotContext>();

commands.use(commonCommands);
