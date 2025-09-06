import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { DEFAULT_TIMEZONE } from "../constants/datetime.js";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault(DEFAULT_TIMEZONE);

const configuredDayjs = dayjs;
export { configuredDayjs as dayjs };
