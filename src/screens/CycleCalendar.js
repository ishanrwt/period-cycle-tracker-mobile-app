import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEngine } from '../context/EngineContext';

export default function CycleCalendar() {
  const { phasePlan } = useEngine();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const mm = String(viewMonth + 1).padStart(2, '0');

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dd = String(i).padStart(2, '0');
      days.push({ dayNumber: i, isoDate: `${viewYear}-${mm}-${dd}` });
    }

    const paddingEnd = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < paddingEnd; i++) {
      days.push(null);
    }
    return days;
  }, [viewYear, viewMonth]);

  const getDayColor = (isoDate) => {
    if (!phasePlan) return '#FFFFFF';

    const inRange = (range) => range && isoDate >= range.start && isoDate <= range.end;

    if (inRange(phasePlan.menstrual)) return '#E8B4B8'; // Dusty Pink
    if (inRange(phasePlan.proliferative)) return '#B8CBD0'; // Powder Blue
    if (inRange(phasePlan.highFertility)) return '#A8B5A2'; // Sage Green
    if (inRange(phasePlan.secretory)) return '#D8C9B0'; // Warm Taupe

    return '#FFFFFF'; // Default
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarIconPlaceholder} />
        <Text style={styles.appBarTitle}>CALENDAR</Text>
        <View style={styles.appBarIconPlaceholder} />
      </View>

      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
        
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={goToPreviousMonth}
            activeOpacity={0.7}
            accessibilityLabel="Previous month"
          >
            <Text style={styles.monthNavText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={goToNextMonth}
            activeOpacity={0.7}
            accessibilityLabel="Next month"
          >
            <Text style={styles.monthNavText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarCard}>
          {/* Weekday Labels */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {calendarDays.map((dayObj, idx) => {
              if (!dayObj) {
                return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
              }

              const bgColor = getDayColor(dayObj.isoDate);
              const isColored = bgColor !== '#FFFFFF';

              return (
                <View 
                  key={dayObj.isoDate} 
                  style={[
                    styles.dayCell, 
                    isColored ? { backgroundColor: bgColor } : { backgroundColor: '#FDFBF7' }
                  ]}
                >
                  <Text style={[styles.dayText, isColored && { color: '#333333', fontWeight: '600' }]}>
                    {dayObj.dayNumber}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#E8B4B8' }]} />
            <Text style={styles.legendText}>Menstruation</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#B8CBD0' }]} />
            <Text style={styles.legendText}>Follicular Phase</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#A8B5A2' }]} />
            <Text style={styles.legendText}>Ovulation Phase</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#D8C9B0' }]} />
            <Text style={styles.legendText}>Luteal Phase</Text>
          </View>
        </View>

      </ScrollView>
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
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#333333',
    fontFamily: 'Inter',
  },
  appBarIconPlaceholder: {
    width: 32,
    height: 32,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 100,
  },
  calendarHeader: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    fontSize: 28,
    color: '#333333',
    fontWeight: '400',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
    minWidth: 200,
    textAlign: 'center',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 32,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    fontFamily: 'Inter',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCellEmpty: {
    width: '13%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Inter',
  },
  legendContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Inter',
  }
});
