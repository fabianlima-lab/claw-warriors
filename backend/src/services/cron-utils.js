import pkg from 'cron-parser';
const { parseExpression } = pkg;

/**
 * Calculate the next run time for a cron expression in a specific timezone.
 *
 * @param {string} cronExpr - Cron expression (e.g., "0 9 * * 1-5")
 * @param {string} timezone - IANA timezone (e.g., "America/New_York")
 * @returns {Date|null} Next run time as a Date, or null if invalid
 */
export function calculateNextRun(cronExpr, timezone = 'America/New_York') {
  try {
    const interval = parseExpression(cronExpr, {
      tz: timezone,
      currentDate: new Date(),
    });
    return interval.next().toDate();
  } catch (err) {
    console.error(`[CRON] invalid expression "${cronExpr}": ${err.message}`);
    return null;
  }
}

/**
 * Validate a cron expression.
 *
 * @param {string} cronExpr - Cron expression to validate
 * @returns {boolean} true if valid
 */
export function isValidCron(cronExpr) {
  try {
    parseExpression(cronExpr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a cron expression to a human-readable string.
 *
 * @param {string} cronExpr - Cron expression
 * @returns {string} Human-readable schedule description
 */
export function humanReadableCron(cronExpr) {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) return cronExpr;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);
    const timeStr = formatTime(hourNum, minuteNum);

    // Every day at specific time
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Every day at ${timeStr}`;
    }

    // Weekdays
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '1-5') {
      return `Every weekday at ${timeStr}`;
    }

    // Specific days of the week
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      const dayNames = parseDayOfWeek(dayOfWeek);
      return `Every ${dayNames} at ${timeStr}`;
    }

    // Every N hours
    if (hour.startsWith('*/')) {
      const interval = hour.replace('*/', '');
      return `Every ${interval} hours`;
    }

    // Every N minutes
    if (minute.startsWith('*/')) {
      const interval = minute.replace('*/', '');
      return `Every ${interval} minutes`;
    }

    return `Cron: ${cronExpr}`;
  } catch {
    return cronExpr;
  }
}

/**
 * Convert hour in user's timezone to the equivalent pulse cron.
 * Pulse checks use fixed hours (8, 12, 17, 21) in the user's local time.
 *
 * @param {number} hour - Hour in 24h format (0-23)
 * @returns {string} Cron expression for daily at that hour
 */
export function pulseHourToCron(hour) {
  return `0 ${hour} * * *`;
}

// ── Helpers ──

function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

function parseDayOfWeek(expr) {
  const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

  // Range: "1-5"
  if (expr.includes('-')) {
    const [start, end] = expr.split('-').map(Number);
    return `${dayMap[start]}-${dayMap[end]}`;
  }

  // List: "1,3,5"
  if (expr.includes(',')) {
    return expr.split(',').map((d) => dayMap[parseInt(d, 10)] || d).join(', ');
  }

  return dayMap[parseInt(expr, 10)] || expr;
}
