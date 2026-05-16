import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Alert,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';

import { formatRange } from '../utils/engine';
import { useEngine } from '../context/EngineContext';

// ─── Inline Calendar Picker ───────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate ? new Date(selectedDate).getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate ? new Date(selectedDate).getMonth() : today.getMonth());

  const goBack = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goForward = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toIso = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  const todayIso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  return (
    <View style={calStyles.wrapper}>
      {/* Month / Year header */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={goBack} style={calStyles.navBtn}>
          <Text style={calStyles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={goForward} style={calStyles.navBtn}>
          <Text style={calStyles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={calStyles.dayNamesRow}>
        {DAY_NAMES.map(d => <Text key={d} style={calStyles.dayName}>{d}</Text>)}
      </View>

      {/* Grid */}
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const iso = toIso(day);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          const isFuture = iso > todayIso;
          return (
            <TouchableOpacity
              key={iso}
              style={[
                calStyles.cell,
                isSelected && calStyles.cellSelected,
                isToday && !isSelected && calStyles.cellToday,
                isFuture && calStyles.cellFuture,
              ]}
              onPress={() => !isFuture && onSelectDate(iso)}
              activeOpacity={isFuture ? 1 : 0.7}
            >
              <Text style={[
                calStyles.cellText,
                isSelected && calStyles.cellTextSelected,
                isFuture && calStyles.cellTextFuture,
              ]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  wrapper: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 24, color: '#333333', fontWeight: '400' },
  monthLabel: { fontSize: 16, fontWeight: '600', color: '#333333', fontFamily: 'Inter' },
  dayNamesRow: { flexDirection: 'row', marginBottom: 4 },
  dayName: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#888888', fontFamily: 'Inter' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: '#E8B4B8', borderRadius: 20 },
  cellToday: { borderWidth: 1, borderColor: '#E8B4B8', borderRadius: 20 },
  cellFuture: { opacity: 0.3 },
  cellText: { fontSize: 13, color: '#333333', fontFamily: 'Inter' },
  cellTextSelected: { color: '#333333', fontWeight: '700' },
  cellTextFuture: { color: '#888888' },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function DeveloperDashboard() {
  const {
    userHistory,
    setUserHistory,
    showStartPeriodToday,
    togglePeriod,
    averageCycle,
    periodLength,
    phasePlan,
    currentDay,
    activePhase,
    isOverdue,
    daysLate,
    logHistoricalCycle
  } = useEngine();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [historicalDate, setHistoricalDate] = useState('');
  const [historicalLength, setHistoricalLength] = useState(6);
  const overduePulse = useRef(new Animated.Value(1)).current;

  const handleHistoricalSave = () => {
    if (!historicalDate) {
      Alert.alert("No Date Selected", "Please pick a start date from the calendar.");
      return;
    }
    const success = logHistoricalCycle(historicalDate, historicalLength);
    if (success) {
      setModalVisible(false);
      setHistoricalDate('');
      setHistoricalLength(6);
    } else {
      Alert.alert("Duplicate Entry", "This cycle start date is already logged.");
    }
  };
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // SVG Wheel Math
  const r = 104;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;
  
  const mLen = periodLength || 6;
  const fLen = Math.max(1, 13 - mLen);
  const oLen = 4;
  const lLen = Math.max(1, (averageCycle || 28) - 17);
  const totalDays = mLen + fLen + oLen + lLen;

  const mDash = (mLen / totalDays) * circumference;
  const fDash = (fLen / totalDays) * circumference;
  const oDash = (oLen / totalDays) * circumference;
  const lDash = (lLen / totalDays) * circumference;

  const mOffset = 0;
  const fOffset = -mDash;
  const oOffset = -(mDash + fDash);
  const lOffset = -(mDash + fDash + oDash);
  
  // Clamp the day indicator dot: max one full revolution
  const currentDayAngle = Math.min(((currentDay || 0) / totalDays) * 360, 359.9);

  useEffect(() => {
    // Pulse animation when overdue
    if (isOverdue) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(overduePulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
          Animated.timing(overduePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, [currentDay]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '-90deg']
  });

  const phaseCards = [
    { key: 'menstrual', label: 'Menstruation', color: '#E8B4B8', data: phasePlan?.menstrual },
    { key: 'proliferative', label: 'Follicular Phase', color: '#B8CBD0', data: phasePlan?.proliferative },
    { key: 'highFertility', label: 'Ovulation', color: '#A8B5A2', data: phasePlan?.highFertility },
    { key: 'secretory', label: 'Luteal Phase', color: '#D8C9B0', data: phasePlan?.secretory }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar - REGINA */}
      <View style={styles.appBar}>
        <View style={styles.appBarIconPlaceholder} />
        <Text style={styles.appBarTitle}>REGINA</Text>
        <View style={styles.appBarIconPlaceholder} />
      </View>

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          {/* Hero Section: Progress Ring */}
          <View style={styles.heroSection}>
            <View style={styles.ringContainer}>
              <Animated.View style={{ transform: [{ rotate: spin }], opacity: isOverdue ? overduePulse : 1 }}>
                <Svg width="240" height="240" viewBox="0 0 240 240">
                  <G>
                    <Circle cx="120" cy="120" r={r} stroke="rgba(0,0,0,0.03)" strokeWidth={strokeWidth} fill="none" />

                    {isOverdue ? (
                      // Overdue: solid full ring in taupe warning color
                      <Circle
                        cx="120" cy="120" r={r}
                        stroke="#D8C9B0"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                      />
                    ) : (
                      // Normal: phase arc segments
                      <>
                        <Circle cx="120" cy="120" r={r} stroke="#D8C9B0" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${lDash} ${circumference}`} strokeDashoffset={lOffset} strokeLinecap="round" />
                        <Circle cx="120" cy="120" r={r} stroke="#A8B5A2" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${oDash} ${circumference}`} strokeDashoffset={oOffset} strokeLinecap="round" />
                        <Circle cx="120" cy="120" r={r} stroke="#B8CBD0" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${fDash} ${circumference}`} strokeDashoffset={fOffset} strokeLinecap="round" />
                        <Circle cx="120" cy="120" r={r} stroke="#E8B4B8" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${mDash} ${circumference}`} strokeDashoffset={mOffset} strokeLinecap="round" />
                        {currentDay > 0 && (
                          <G rotation={currentDayAngle} origin="120, 120">
                            <Circle cx="120" cy={120 - r} r="8" fill="#333333" stroke="#FFFFFF" strokeWidth="2" />
                          </G>
                        )}
                      </>
                    )}
                  </G>
                </Svg>
              </Animated.View>
              
              {/* Inner Circle Cutout */}
              <View style={[styles.innerCircle, { position: 'absolute' }]}>
                {isOverdue ? (
                  <>
                    <Text style={[styles.dayText, { fontSize: 28, color: '#C4956A' }]}>
                      {daysLate} {daysLate === 1 ? 'Day' : 'Days'}
                    </Text>
                    <Text style={[styles.dayText, { fontSize: 18, fontWeight: '500', color: '#C4956A' }]}>Late</Text>
                    <Text style={[styles.phaseSubtitle, { color: '#C4956A', fontSize: 12 }]}>Period Overdue</Text>
                  </>
                ) : currentDay ? (
                  <>
                    <Text style={styles.dayText}>Day {currentDay}</Text>
                    <Text style={styles.phaseSubtitle}>
                      {activePhase === 'menstrual' && 'Menstruation'}
                      {activePhase === 'proliferative' && 'Follicular Phase'}
                      {activePhase === 'highFertility' && 'Ovulation'}
                      {activePhase === 'secretory' && 'Luteal Phase'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.dayTextEmpty}>Log</Text>
                    <Text style={styles.phaseSubtitle}>to start</Text>
                  </>
                )}
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#E8B4B8' }]} 
                onPress={togglePeriod}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, { color: '#333333' }]}>
                  {showStartPeriodToday ? 'Log Current Day' : 'End Period Today'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#333333' }]} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                  Log Past Cycle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, marginTop: 32 }}>
          {/* Phase Forecast Bento Cards */}
          <Text style={styles.sectionTitle}>Upcoming Phases</Text>
          <View style={styles.cardsContainer}>
            {phasePlan ? (
              phaseCards.map((phase) => {
                const isActive = activePhase === phase.key;
                return (
                  <View 
                    key={phase.key} 
                    style={[
                      styles.phaseCard, 
                      { backgroundColor: `${phase.color}1A` }, // 10% opacity
                      isActive && { backgroundColor: `${phase.color}33`, borderColor: `${phase.color}4D`, borderWidth: 1 }
                    ]}
                  >
                    <View style={styles.phaseCardLeft}>
                      <View style={[
                        styles.dot, 
                        { backgroundColor: phase.color },
                        isActive && { shadowColor: phase.color, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
                      ]} />
                      <Text style={styles.phaseCardLabel}>{phase.label}</Text>
                    </View>
                    <Text style={styles.phaseCardDate}>
                      {formatRange(phase.data)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>
                  Please log a period to generate your phase forecast.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Widget */}
          {userHistory.length > 0 && (
            <View style={styles.footerWidgetContainer}>
              <View style={styles.footerWidget}>
                <Text style={styles.footerWidgetText}>
                  Average Cycle: {averageCycle} Days
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Historical Cycle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Start Date</Text>
              {historicalDate ? (
                <Text style={styles.selectedDateDisplay}>{historicalDate}</Text>
              ) : null}
              <CalendarPicker
                selectedDate={historicalDate}
                onSelectDate={setHistoricalDate}
              />

              <Text style={styles.modalLabel}>Period Length (Days)</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity onPress={() => setHistoricalLength(Math.max(1, historicalLength - 1))} style={styles.stepperButton}>
                  <Text style={styles.stepperButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{historicalLength}</Text>
                <TouchableOpacity onPress={() => setHistoricalLength(Math.min(14, historicalLength + 1))} style={styles.stepperButton}>
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleHistoricalSave}>
                <Text style={styles.modalSaveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(253, 251, 247, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    zIndex: 10,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#333333',
    fontFamily: 'Inter',
  },
  appBarIconPlaceholder: {
    width: 32,
    height: 32,
  },
  appBarClearBtn: {
    padding: 8,
  },
  appBarClearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: '#FDFBF7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: -0.5,
    fontFamily: 'Inter',
  },
  dayTextEmpty: {
    fontSize: 32,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: -0.5,
  },
  phaseSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A8B5A2',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 8,
    fontFamily: 'Inter',
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  phaseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  phaseCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  phaseCardDate: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '400',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  emptyCardText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerWidgetContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerWidget: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  footerWidgetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FDFBF7',
    borderRadius: 24,
    width: '92%',
    maxHeight: '85%',
    padding: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888888',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  selectedDateDisplay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8B4B8',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepperButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '500',
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 24,
    fontFamily: 'Inter',
  },
  modalSaveButton: {
    backgroundColor: '#D8C9B0',
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  }
});
