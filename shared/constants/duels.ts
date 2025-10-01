export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

export const DUEL_REQUEST_VALIDITY_PERIOD = HOUR;
export const DUEL_PERIOD = DAY;

export const DUEL_REPORT_REMINDER_TIMEOUTS = [
  HOUR * 20, // 4 hours before the deadline.
  HOUR * 23, // 1 hour before the deadline.
  HOUR * 23 + MINUTE * 45, // 15 minutes before the deadline.
];
