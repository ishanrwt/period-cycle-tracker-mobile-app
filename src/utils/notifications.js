import * as Notifications from 'expo-notifications';
import {
  addDaysToIsoDate,
  computeAverageCycle,
  computeUpcomingPhaseTransitionDates,
  sortHistoryChronological,
  inclusiveCalendarDays,
} from './engine';

const NOTIFICATION_HOUR = 9;

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

/** Local 9:00 AM on the given YYYY-MM-DD date. */
function dateAt9AM(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d, NOTIFICATION_HOUR, 0, 0, 0);
}

async function scheduleAt9AM(isoDate, content) {
  const triggerDate = dateAt9AM(isoDate);
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }
  return Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function ensureNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureAndroidChannel() {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Cycle reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Clears all scheduled notifications and rebuilds cycle/phase alarms from latest data.
 * @param {Array} userHistory
 * @param {number} [periodLength] — bleed length fallback when latest period is open
 */
export async function scheduleAllCycleNotifications(userHistory, periodLength = 6) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    return;
  }

  await ensureAndroidChannel();

  const periodEntries = userHistory.filter(
    (e) => e.type === 'period' && e.startDate
  );
  if (periodEntries.length === 0) {
    return;
  }

  const sorted = sortHistoryChronological(periodEntries);
  const latest = sorted[sorted.length - 1];
  const averageCycleLength = computeAverageCycle(userHistory);
  const bleedDaysForPhases =
    latest.endDate == null
      ? periodLength
      : inclusiveCalendarDays(latest.startDate, latest.endDate);

  const dates = computeUpcomingPhaseTransitionDates(
    latest.startDate,
    averageCycleLength,
    bleedDaysForPhases
  );

  if (!dates) {
    return;
  }

  if (dates.nextPeriod) {
    const periodReminderDay = addDaysToIsoDate(dates.nextPeriod, -2);
    await scheduleAt9AM(periodReminderDay, {
      title: 'REGINA Insight',
      body: 'Your next cycle is predicted to start in 2 days.',
    });
  }

  if (dates.follicular) {
    const notifyDay = addDaysToIsoDate(dates.follicular, -1);
    await scheduleAt9AM(notifyDay, {
      title: 'Phase Change',
      body: 'You are entering your Follicular phase tomorrow. Your energy may start to rise.',
    });
  }

  if (dates.ovulation) {
    const notifyDay = addDaysToIsoDate(dates.ovulation, -1);
    await scheduleAt9AM(notifyDay, {
      title: 'Phase Change',
      body: 'You are entering your Ovulation phase tomorrow. Expect a boost in energy!',
    });
  }

  if (dates.luteal) {
    const notifyDay = addDaysToIsoDate(dates.luteal, -1);
    await scheduleAt9AM(notifyDay, {
      title: 'Phase Change',
      body: 'You are entering your Luteal phase. Time to prioritize rest.',
    });
  }
}
