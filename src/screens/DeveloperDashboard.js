import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

import {
  addDaysToIsoDate,
  formatRange,
  sortHistoryChronological,
  computeAverageCycle,
  computePhasePlan,
} from '../utils/engine';

export default function DeveloperDashboard() {
  const [userHistory, setUserHistory] = useState([]);
  const [dateInput, setDateInput] = useState('');
  const [periodLength, setPeriodLength] = useState(6);

  const handleLogDate = () => {
    const trimmed = dateInput.trim();
    if (!trimmed) {
      return;
    }

    const duplicate = userHistory.some(
      (e) => e.type === 'period' && e.startDate === trimmed
    );
    if (duplicate) {
      Alert.alert(
        'Duplicate start date',
        `An entry with start date ${trimmed} already exists.`
      );
      return;
    }

    const endDate = addDaysToIsoDate(trimmed, periodLength - 1);
    const newEvent = {
      type: 'period',
      startDate: trimmed,
      endDate,
    };
    setUserHistory(sortHistoryChronological([...userHistory, newEvent]));
    setDateInput('');
  };

  const lastEntryAfterSort = useMemo(() => {
    if (userHistory.length === 0) {
      return null;
    }
    return sortHistoryChronological(userHistory)[userHistory.length - 1];
  }, [userHistory]);

  const showStartPeriodToday =
    userHistory.length === 0 ||
    (lastEntryAfterSort != null && lastEntryAfterSort.endDate != null);

  const todayIso = () => new Date().toISOString().split('T')[0];

  const handleStartPeriodToday = () => {
    const today = todayIso();
    const duplicate = userHistory.some(
      (e) => e.type === 'period' && e.startDate === today
    );
    if (duplicate) {
      Alert.alert(
        'Duplicate start date',
        `An entry with start date ${today} already exists.`
      );
      return;
    }
    const newEvent = { type: 'period', startDate: today, endDate: null };
    setUserHistory(sortHistoryChronological([...userHistory, newEvent]));
  };

  const handleEndPeriodToday = () => {
    const today = todayIso();
    const sorted = sortHistoryChronological(userHistory);
    const last = sorted[sorted.length - 1];
    if (!last || last.endDate != null) {
      return;
    }
    setUserHistory(
      userHistory.map((e) =>
        e.type === 'period' &&
        e.startDate === last.startDate &&
        e.endDate == null
          ? { ...e, endDate: today }
          : e
      )
    );
  };

  const averageCycle = useMemo(
    () => computeAverageCycle(userHistory),
    [userHistory]
  );

  const phasePlan = useMemo(
    () => computePhasePlan(userHistory, averageCycle),
    [userHistory, averageCycle]
  );

  const periodCount = userHistory.filter(
    (e) => e.type === 'period'
  ).length;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dashboardTitle}>Developer Testing Dashboard</Text>
        <Text style={styles.dashboardSubtitle}>
          Flight-deck layout for engine, sorting, and phase verification
        </Text>

        {/* SECTION 1 · CONTROL TOWER */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>SECTION 1</Text>
          <Text style={styles.sectionTitle}>Control Tower</Text>
          <Text style={styles.sectionHint}>User inputs</Text>

          <Text style={styles.label}>Enter Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={dateInput}
            onChangeText={setDateInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.logPeriodButton} onPress={handleLogDate}>
            <Text style={styles.logPeriodButtonText}>Log Period</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Current cycle (live)</Text>
          <Text style={styles.currentCycleHint}>
            Opens a bleeding window with end unknown until you close it.
          </Text>
          {showStartPeriodToday ? (
            <TouchableOpacity
              style={styles.currentCycleStartBtn}
              onPress={handleStartPeriodToday}
              activeOpacity={0.9}
            >
              <Text style={styles.currentCycleStartBtnText}>
                Start Period Today
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.currentCycleEndBtn}
              onPress={handleEndPeriodToday}
              activeOpacity={0.9}
            >
              <Text style={styles.currentCycleEndBtnText}>
                End Period Today
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Period Length (Days)</Text>
          <Text style={styles.stepperHint}>Range: 3–10 (stepped)</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                periodLength <= 3 && styles.stepperBtnDisabled,
              ]}
              disabled={periodLength <= 3}
              onPress={() => setPeriodLength((n) => Math.max(3, n - 1))}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperValueWrap}>
              <Text style={styles.stepperValue}>{periodLength}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                periodLength >= 10 && styles.stepperBtnDisabled,
              ]}
              disabled={periodLength >= 10}
              onPress={() => setPeriodLength((n) => Math.min(10, n + 1))}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 2 · ENGINE READOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>SECTION 2</Text>
          <Text style={styles.sectionTitle}>Engine Readout</Text>
          <Text style={styles.sectionHint}>Real-time math</Text>

          <View style={styles.engineCard}>
            <Text style={styles.engineAverageValue}>
              Detected Average: {averageCycle} Days
            </Text>
            <Text style={styles.engineNote}>
              Note: Gaps &gt; 45 days are ignored by the engine filter.
            </Text>
            <View style={styles.engineDivider} />
            <Text style={styles.engineCounterLabel}>Logged periods</Text>
            <Text style={styles.engineCounterValue}>{periodCount}</Text>
          </View>
        </View>

        {/* SECTION 3 · FORTUNE TELLER'S BOARD */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>SECTION 3</Text>
          <Text style={styles.sectionTitle}>Fortune Teller's Board</Text>
          <Text style={styles.sectionHint}>
            Predicted phases from most recent period (anchor)
          </Text>

          {phasePlan ? (
            <View style={styles.boardCard}>
              <View style={styles.boardRow}>
                <Text style={styles.boardPhase}>Menstruation</Text>
                <Text style={styles.boardRange}>
                  {formatRange(phasePlan.menstrual)}
                </Text>
              </View>
              <View style={styles.boardDivider} />
              <View style={styles.boardRow}>
                <Text style={styles.boardPhase}>Follicular Phase</Text>
                <Text style={styles.boardRange}>
                  {formatRange(phasePlan.proliferative)}
                </Text>
              </View>
              <View style={styles.boardDivider} />
              <View style={styles.boardRow}>
                <Text style={styles.boardPhase}>Ovulation</Text>
                <Text style={styles.boardRange}>
                  {formatRange(phasePlan.highFertility)}
                </Text>
              </View>
              <View style={styles.boardDivider} />
              <View style={styles.boardRow}>
                <Text style={styles.boardPhase}>Luteal Phase</Text>
                <Text style={styles.boardRange}>
                  {formatRange(phasePlan.secretory)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.boardEmpty}>
              <Text style={styles.boardEmptyText}>
                Log a period start to see upcoming calendar ranges. (Engine
                needs non-empty userHistory.)
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 4 · THE BLACK BOX */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>SECTION 4</Text>
          <Text style={styles.sectionTitle}>The Black Box</Text>
          <Text style={styles.sectionHint}>Raw database (chronological order)</Text>

          <View style={styles.blackBoxOuter}>
            <ScrollView
              style={styles.blackBoxScroll}
              contentContainerStyle={styles.blackBoxScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <Text
                style={styles.blackBoxJson}
                selectable
              >
                {JSON.stringify(userHistory, null, 2)}
              </Text>
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearHistoryButton}
          onPress={() => setUserHistory([])}
          activeOpacity={0.85}
        >
          <Text style={styles.clearHistoryButtonText}>Clear History</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e8ecf1',
    paddingTop: 52,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  dashboardSubtitle: {
    marginTop: 6,
    marginBottom: 22,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  section: {
    marginBottom: 22,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 16,
    color: '#0f172a',
  },
  logPeriodButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#b91c1c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  logPeriodButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  currentCycleHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    marginTop: -4,
    lineHeight: 17,
  },
  currentCycleStartBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  currentCycleStartBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  currentCycleEndBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  currentCycleEndBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepperHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    marginTop: -4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtn: {
    width: 52,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  stepperBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  stepperBtnText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
  stepperValueWrap: {
    minWidth: 64,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  engineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  engineAverageValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  engineNote: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
  },
  engineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
    marginVertical: 16,
  },
  engineCounterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  engineCounterValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '800',
    color: '#0369a1',
  },
  boardCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  boardRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  boardPhase: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  boardRange: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0f172a',
    lineHeight: 20,
  },
  boardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
  },
  boardEmpty: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
  },
  boardEmptyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  blackBoxOuter: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    maxHeight: 260,
  },
  blackBoxScroll: {
    maxHeight: 260,
  },
  blackBoxScrollContent: {
    padding: 14,
  },
  blackBoxJson: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 17,
    color: '#e2e8f0',
  },
  clearHistoryButton: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#64748b',
  },
  clearHistoryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.3,
  },
});
