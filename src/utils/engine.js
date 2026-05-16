/** Calendar math for YYYY-MM-DD (UTC, rollover-safe). */
export function addDaysToIsoDate(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return isoDate;
  }
  const ms = Date.UTC(y, m - 1, d + deltaDays);
  const nd = new Date(ms);
  const yy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nd.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function cycleRangeToDates(anchorIso, startCycleDay, endCycleDay) {
  if (startCycleDay > endCycleDay) {
    return null;
  }
  return {
    start: addDaysToIsoDate(anchorIso, startCycleDay - 1),
    end: addDaysToIsoDate(anchorIso, endCycleDay - 1),
  };
}

export function formatRange(range) {
  if (!range) {
    return '— (no days in range)';
  }
  return `${range.start} → ${range.end}`;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Inclusive calendar-day count from startIso to endIso (YYYY-MM-DD, UTC). */
export function inclusiveCalendarDays(startIso, endIso) {
  const a = new Date(startIso + 'T12:00:00.000Z');
  const b = new Date(endIso + 'T12:00:00.000Z');
  const raw = Math.round((b - a) / MS_PER_DAY) + 1;
  return Math.max(1, raw);
}

export function sortHistoryChronological(entries) {
  return [...entries].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );
}

/**
 * Average cycle length from consecutive period start dates (gaps > 45 days ignored).
 * @param {Array} userHistory
 * @returns {number}
 */
export function computeAverageCycle(userHistory) {
  if (userHistory.length < 2) {
    return 28;
  }

  const periodStarts = userHistory
    .filter((e) => e.type === 'period' && e.startDate)
    .map((e) => e.startDate)
    .sort((a, b) => new Date(a) - new Date(b));

  if (periodStarts.length < 2) {
    return 28;
  }

  const normalGaps = [];
  for (let i = 1; i < periodStarts.length; i++) {
    const gapDays = Math.round(
      (new Date(periodStarts[i]) - new Date(periodStarts[i - 1])) /
        (1000 * 60 * 60 * 24)
    );
    if (gapDays <= 45) {
      normalGaps.push(gapDays);
    }
  }

  if (normalGaps.length === 0) {
    return 28;
  }

  const sum = normalGaps.reduce((acc, g) => acc + g, 0);
  return Math.round(sum / normalGaps.length);
}

/**
 * Phase boundaries for the upcoming cycle anchored on the most recent period start.
 * @param {Array} userHistory
 * @param {number} averageCycle
 * @returns {object|null}
 */
export function computePhasePlan(userHistory, averageCycle) {
  if (userHistory.length === 0) {
    return null;
  }

  const periodEntries = userHistory
    .filter((e) => e.type === 'period' && e.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (periodEntries.length === 0) {
    return null;
  }

  const latest = periodEntries[periodEntries.length - 1];
  const anchor = latest.startDate;
  const bleedDaysForPhases =
    latest.endDate == null
      ? 5
      : inclusiveCalendarDays(latest.startDate, latest.endDate);

  const ovulationDay = averageCycle - 14;

  return {
    anchor,
    ovulationDay,
    menstrual: cycleRangeToDates(anchor, 1, bleedDaysForPhases),
    proliferative: cycleRangeToDates(
      anchor,
      bleedDaysForPhases + 1,
      ovulationDay - 1
    ),
    highFertility: cycleRangeToDates(
      anchor,
      ovulationDay - 2,
      ovulationDay
    ),
    secretory: cycleRangeToDates(anchor, ovulationDay + 1, averageCycle),
  };
}

/**
 * Upcoming calendar dates for the next phase transitions and predicted period start.
 * Rolls forward across cycles until each date is strictly after today.
 *
 * @param {string} lastPeriodStartDate — YYYY-MM-DD anchor (cycle day 1)
 * @param {number} averageCycleLength
 * @param {number} [bleedDaysForPhases=5] — menstrual length used for follicular start
 * @returns {{ follicular: string, ovulation: string, luteal: string, nextPeriod: string } | null}
 */
export function computeUpcomingPhaseTransitionDates(
  lastPeriodStartDate,
  averageCycleLength,
  bleedDaysForPhases = 5
) {
  if (!lastPeriodStartDate || !Number.isFinite(averageCycleLength) || averageCycleLength < 1) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const ovulationDay = averageCycleLength - 14;

  const pickFirstFuture = (offsetFromAnchor) => {
    for (let cycle = 0; cycle < 24; cycle += 1) {
      const anchor = addDaysToIsoDate(
        lastPeriodStartDate,
        cycle * averageCycleLength
      );
      const date = addDaysToIsoDate(anchor, offsetFromAnchor);
      if (date > today) {
        return date;
      }
    }
    return null;
  };

  return {
    follicular: pickFirstFuture(bleedDaysForPhases),
    ovulation: pickFirstFuture(ovulationDay - 3),
    luteal: pickFirstFuture(ovulationDay),
    nextPeriod: pickFirstFuture(averageCycleLength),
  };
}
