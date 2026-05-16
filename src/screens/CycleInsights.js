import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEngine } from '../context/EngineContext';

export default function CycleInsights() {
  const { userHistory } = useEngine();

  const dynamicChartData = useMemo(() => {
    const history = userHistory || [];
    const periodStarts = history
      .filter((e) => e && e.type === 'period' && e.startDate)
      .map((e) => e.startDate)
      .sort((a, b) => new Date(a) - new Date(b));
      
    if (periodStarts.length < 2) return null;
    
    const data = [];
    for (let i = 1; i < periodStarts.length; i++) {
      const d1 = new Date(periodStarts[i-1] + 'T12:00:00.000Z');
      const d2 = new Date(periodStarts[i] + 'T12:00:00.000Z');
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

      // Outlier Guard: skip gaps that are biologically implausible
      // (< 15 days = data error, > 60 days = skipped month / anomaly)
      if (diff < 15 || diff > 60) continue;

      const monthStr = d1.toLocaleString('default', { month: 'short' });
      data.push({ label: monthStr, value: diff });
    }
    
    return data.slice(-6);
  }, [userHistory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarIconPlaceholder} />
        <Text style={styles.appBarTitle}>INSIGHTS</Text>
        <View style={styles.appBarIconPlaceholder} />
      </View>

      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
        
        <Text style={styles.pageHeader}>Cycle Trends</Text>
        <Text style={styles.pageSubHeader}>Your cycle variations over the last 6 months.</Text>

        {/* Cycle Trends Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cycle Length History</Text>
          
          {dynamicChartData && dynamicChartData.length > 0 ? (
            <React.Fragment>
              <View style={styles.barChartContainer}>
                {dynamicChartData.map((item, index) => {
                  const heightPct = Math.min((item.value / 35) * 100, 100);
                  const isHighlight = item.value > 30 || item.value < 25; // highlight irregular
                  
                  return (
                    <View key={index} style={styles.barColumn}>
                      <Text style={styles.barValue}>{item.value}</Text>
                      <View style={styles.barTrack}>
                        <View 
                          style={[
                            styles.barFill, 
                            { height: `${heightPct}%`, backgroundColor: '#E8B4B8' },
                            isHighlight && { backgroundColor: '#D8C9B0' }
                          ]} 
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartFooter}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#E8B4B8' }]} />
                  <Text style={styles.legendText}>Normal</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#D8C9B0' }]} />
                  <Text style={styles.legendText}>Irregular</Text>
                </View>
              </View>
            </React.Fragment>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Log at least 2 cycles to generate your historical trends.
              </Text>
            </View>
          )}
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
  pageHeader: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  pageSubHeader: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Inter',
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
    marginBottom: 24,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  barColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
  },
  barTrack: {
    height: 120,
    width: 32,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#333333',
    borderRadius: 16,
  },
  barLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 12,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#888888',
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  }
});
