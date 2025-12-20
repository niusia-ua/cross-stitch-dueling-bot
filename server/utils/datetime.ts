import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Europe/Kyiv");

/**
 * Checks if the current time is the day before the weekly random duels (after 10:00 Friday and before 10:00 Saturday by UTC).
 * @returns True if it is the day before the weekly random duels, false otherwise.
 */
export function isItTheDayBeforeWeeklyRandomDuels() {
  // In development mode, always return `false`.
  if (import.meta.dev) return false;

  const now = dayjs().utc();
  const [day, hour] = [now.day(), now.hour()];
  return (day === 5 && hour >= 7) || (day === 6 && hour <= 7);
}

export { dayjs };
