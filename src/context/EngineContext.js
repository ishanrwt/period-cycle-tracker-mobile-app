import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sortHistoryChronological,
  computeAverageCycle,
  computePhasePlan,
  addDaysToIsoDate,
} from '../utils/engine';
import { scheduleAllCycleNotifications } from '../utils/notifications';

const EngineContext = createContext(null);

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  return context;
};

export const EngineProvider = ({ children }) => {
  const [userHistory, setUserHistory] = useState([]);
  const [periodLength, setPeriodLength] = useState(6);
  // Profile state (moved here so it persists globally)
  const [userName, setUserNameState] = useState('Aura User');
  // avatarUri is a string URI (gallery pick) or null
  const [avatarUri, setAvatarUriState] = useState(null);
  // avatarPresetIndex is a number (0-7) for preset images, or null
  const [avatarPresetIndex, setAvatarPresetIndexState] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  // ─── LOAD: Hydrate all state from AsyncStorage on app mount ───────────────
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [
          storedHistory,
          storedName,
          storedAvatarUri,
          storedPresetIndex,
          storedPeriodLength,
        ] = await AsyncStorage.multiGet([
          '@user_history',
          '@user_name',
          '@avatar_uri',
          '@avatar_preset_index',
          '@period_length',
        ]);

        if (storedHistory[1]) setUserHistory(JSON.parse(storedHistory[1]));
        if (storedName[1]) setUserNameState(storedName[1]);
        if (storedAvatarUri[1]) setAvatarUriState(storedAvatarUri[1]);
        if (storedPresetIndex[1] !== null) setAvatarPresetIndexState(JSON.parse(storedPresetIndex[1]));
        if (storedPeriodLength[1]) setPeriodLength(JSON.parse(storedPeriodLength[1]));
      } catch (e) {
        console.error('Failed to load data from AsyncStorage', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadAllData();
  }, []);

  // ─── SAVE: Persist userHistory whenever it changes ────────────────────────
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@user_history', JSON.stringify(userHistory)).catch(e =>
        console.error('Failed to save history', e)
      );
    }
  }, [userHistory, isLoaded]);

  // ─── Master scheduler: resync local notifications when history changes ───
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    scheduleAllCycleNotifications(userHistory, periodLength).catch((e) =>
      console.error('Failed to schedule cycle notifications', e)
    );
  }, [userHistory, isLoaded, periodLength]);

  // ─── SAVE: Persist periodLength whenever it changes ───────────────────────
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('@period_length', JSON.stringify(periodLength)).catch(e =>
        console.error('Failed to save periodLength', e)
      );
    }
  }, [periodLength, isLoaded]);

  // ─── Wrapped setters that also persist to AsyncStorage ───────────────────
  const setUserName = (name) => {
    setUserNameState(name);
    AsyncStorage.setItem('@user_name', name).catch(e =>
      console.error('Failed to save user name', e)
    );
  };

  const setAvatarUri = (uri) => {
    setAvatarUriState(uri);
    setAvatarPresetIndexState(null); // clear preset if gallery image chosen
    AsyncStorage.multiSet([
      ['@avatar_uri', uri || ''],
      ['@avatar_preset_index', 'null'],
    ]).catch(e => console.error('Failed to save avatar uri', e));
  };

  const setAvatarPresetIndex = (index) => {
    setAvatarPresetIndexState(index);
    setAvatarUriState(null); // clear gallery uri if preset chosen
    AsyncStorage.multiSet([
      ['@avatar_preset_index', JSON.stringify(index)],
      ['@avatar_uri', ''],
    ]).catch(e => console.error('Failed to save avatar preset', e));
  };

  // ─── Engine computed values ───────────────────────────────────────────────
  const lastEntryAfterSort = useMemo(() => {
    if (userHistory.length === 0) return null;
    return sortHistoryChronological(userHistory)[userHistory.length - 1];
  }, [userHistory]);

  const showStartPeriodToday =
    userHistory.length === 0 ||
    (lastEntryAfterSort != null && lastEntryAfterSort.endDate != null);

  const todayIso = () => new Date().toISOString().split('T')[0];

  const currentDay = useMemo(() => {
    if (!lastEntryAfterSort) return null;
    const startMs = new Date(lastEntryAfterSort.startDate).getTime();
    const todayMs = new Date(todayIso()).getTime();
    const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  }, [lastEntryAfterSort]);

  const handleStartPeriodToday = () => {
    const today = todayIso();
    const newEvent = { type: 'period', startDate: today, endDate: null };
    setUserHistory(sortHistoryChronological([...userHistory, newEvent]));
  };

  const handleEndPeriodToday = () => {
    const today = todayIso();
    const sorted = sortHistoryChronological(userHistory);
    const last = sorted[sorted.length - 1];
    if (!last || last.endDate != null) return;
    setUserHistory(
      userHistory.map((e) =>
        e.type === 'period' && e.startDate === last.startDate && e.endDate == null
          ? { ...e, endDate: today }
          : e
      )
    );
  };

  const togglePeriod = showStartPeriodToday ? handleStartPeriodToday : handleEndPeriodToday;

  const logHistoricalCycle = (startDate, length) => {
    if (userHistory.some(e => e.type === 'period' && e.startDate === startDate)) {
      return false;
    }
    const endDate = addDaysToIsoDate(startDate, length - 1);
    const newEvent = { type: 'period', startDate, endDate };
    setUserHistory(sortHistoryChronological([...userHistory, newEvent]));
    return true;
  };

  const averageCycle = useMemo(
    () => computeAverageCycle(userHistory),
    [userHistory]
  );

  const phasePlan = useMemo(
    () => computePhasePlan(userHistory, averageCycle),
    [userHistory, averageCycle]
  );

  const getActivePhaseKey = () => {
    if (!currentDay) return null;
    if (currentDay <= periodLength) return 'menstrual';
    if (currentDay <= 13) return 'proliferative';
    if (currentDay <= 17) return 'highFertility';
    return 'secretory';
  };

  const activePhase = getActivePhaseKey();

  // ─── Overdue detection ───────────────────────────────────────────────────
  // If currentDay exceeds the average cycle length, the period is overdue.
  const isOverdue = currentDay != null && currentDay > averageCycle;
  const daysLate = isOverdue ? currentDay - averageCycle : 0;

  const value = {
    // Cycle data
    userHistory,
    setUserHistory,
    periodLength,
    setPeriodLength,
    showStartPeriodToday,
    togglePeriod,
    averageCycle,
    phasePlan,
    currentDay,
    activePhase,
    isOverdue,
    daysLate,
    logHistoricalCycle,
    // Profile data (persisted)
    userName,
    setUserName,
    avatarUri,
    setAvatarUri,
    avatarPresetIndex,
    setAvatarPresetIndex,
  };

  // Block rendering until AsyncStorage has finished loading
  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FDFBF7' }} />;
  }

  return (
    <EngineContext.Provider value={value}>
      {children}
    </EngineContext.Provider>
  );
};
