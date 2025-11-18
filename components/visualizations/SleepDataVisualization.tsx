import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryStack, VictoryContainer } from 'victory-native';
import { SleepData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';

const MAX_SLEEP_HOURS = 16;
const screenWidth = Dimensions.get('window').width;

export interface SleepSession {
  startTime: string;
  endTime: string;
  duration: number;
  quality: number;
}

export interface StackedSleepData {
  x: string;
  y: number;
  quality: number;
  sessionIndex: number;
  startTime: string;
  endTime: string;
}

export interface DayData {
  date: string;
  totalDuration: number;
  actualDuration: number;
  sessions: StackedSleepData[];
  sleepSessions: SleepSession[];
  index: number;
}

interface SleepSessionsListProps {
  sessions: SleepSession[];
}

interface BarPopoutProps {
  data: {
    x: string;
    actualDuration: number;
    quality: number;
    sleepCount: number;
    sleepSessions: SleepSession[];
  };
  onClose: () => void;
  position: {
    x: number;
    y: number;
  };
}

interface SleepVisualizationProps {
  sleepData: SleepData[];
  rangeDays: number;
  onEditRequest?: (payload: SleepData) => void;
  dataVersion?: number;
}

export const getQualityColor = (quality: number) => {
  switch (quality) {
    case 5: return '#4287f5';
    case 4: return '#00c896';
    case 3: return '#ffd000';
    case 2: return '#ff9900';
    case 1: return '#ff4d4d';
    default: return '#ccc';
  }
};

export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export const SleepEntry = ({ sleep }: { sleep: SleepData }) => {
  const duration = (sleep.end.getTime() - sleep.start.getTime()) / (1000 * 60 * 60); // hours
  const backgroundColor = getQualityColor(sleep.quality);
  const { theme } = useTheme();

  return (
    <View style={[
      styles.sleepEntry, 
      { 
        borderLeftColor: backgroundColor,
        backgroundColor: theme.secondaryBackground,
        borderBottomColor: theme.tint
      }
    ]}>
      <View style={styles.sleepEntryHeader}>
        <Text style={[styles.sleepDate, { color: theme.text }]}>{formatDate(sleep.start)}</Text>
        <View style={[styles.qualityIndicator, { backgroundColor }]}>
          <Text style={styles.qualityText}>Quality: {sleep.quality}/5</Text>
        </View>
      </View>
      <View style={styles.sleepTimes}>
        <Text style={[styles.timeText, { color: theme.secondaryText }]}>
          {formatTime(sleep.start)} - {formatTime(sleep.end)}
        </Text>
        <Text style={[styles.durationText, { color: theme.text }]}>
          {duration.toFixed(1)} hours
        </Text>
      </View>
    </View>
  );
};

const SleepSessionsList: React.FC<SleepSessionsListProps> = ({ sessions }) => (
  <View style={styles.sessionsList}>
    {sessions.map((session, index) => (
      <View 
        key={index} 
        style={[
          styles.sessionItem,
          { borderLeftColor: getQualityColor(session.quality) }
        ]}
      >
        <Text style={styles.sessionTime}>
          {session.startTime} - {session.endTime}
        </Text>
        <Text style={styles.sessionDuration}>
          {session.duration.toFixed(1)}h
        </Text>
        <View 
          style={[
            styles.barQualityIndicator,
            { backgroundColor: getQualityColor(session.quality) }
          ]}
        >
          <Text style={styles.barQualityText}>Q{session.quality}</Text>
        </View>
      </View>
    ))}
  </View>
);

const BarPopout: React.FC<BarPopoutProps> = ({ data, onClose, position }) => {
  const [popoutPosition, setPopoutPosition] = useState({ x: 0, y: 0 });
  const lastGestureState = useRef({ dx: 0, dy: 0 });
  const { theme } = useTheme();

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastGestureState.current = { dx: 0, dy: 0 };
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx - lastGestureState.current.dx;
        const dy = gestureState.dy - lastGestureState.current.dy;
        
        setPopoutPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        
        lastGestureState.current = {
          dx: gestureState.dx,
          dy: gestureState.dy
        };
      },
      onPanResponderRelease: () => {
        lastGestureState.current = { dx: 0, dy: 0 };
      }
    })
  ).current;

  return (
    <View 
      style={[
        styles.popout,
        {
          left: popoutPosition.x,
          top: popoutPosition.y,
          position: 'absolute',
          backgroundColor: theme.background,
          borderColor: theme.tint,
          zIndex: 1000,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }
      ]}
      {...panResponder.panHandlers}
    >
      <View 
        style={[styles.popoutHandle, { backgroundColor: theme.tint}]} 
        {...panResponder.panHandlers}
      />
      <View style={styles.popoutContent}>
        <Text style={[styles.popoutTitle, { color: theme.text }]}>
          {new Date(data.x + 'T12:00:00').toLocaleDateString()}{'\n'}
          Total: {data.actualDuration.toFixed(1)}hr
        </Text>
        <View style={styles.sessionsList}>
          {data.sleepSessions.map((session, index) => (
            <View 
              key={index} 
              style={[
                styles.popoutSessionItem,
                { 
                  borderLeftColor: getQualityColor(session.quality),
                  backgroundColor: theme.secondaryBackground,
                }
              ]}
            >
              <View style={styles.popoutTimeContainer}>
                <View style={styles.popoutTimeRow}>
                  <Text style={[styles.popoutTime, { color: theme.text }]}>
                    {session.startTime} - {session.endTime}
                  </Text>
                  <View style={[
                    styles.popoutQuality,
                    { backgroundColor: getQualityColor(session.quality) }
                  ]}>
                    <Text style={styles.popoutQualityText}>Q{session.quality}</Text>
                  </View>
                </View>
                <Text style={[styles.popoutDuration, { color: theme.text }]}>
                  Duration: {session.duration.toFixed(1)}hr
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const filteredSleepData = (rawSleepData: SleepData[], rangeDays: number) => {
  const now = new Date();
  const startDate = new Date(`${new Date().toISOString().split('T')[0]}T12:00:00`);
  startDate.setDate(startDate.getDate() - rangeDays + 1);

  return rawSleepData
    .filter(sleep => {
      return sleep.start >= startDate && sleep.start <= now;
    })
    .sort((a, b) => b.start.getTime() - a.start.getTime());
};

export const processSleepData = (rawSleepData: SleepData[], rangeDays: number) => {
  // Use local calendar-day boundaries for bucketing so sleep sessions
  // don't shift into adjacent days due to UTC/local conversions.
  const now = new Date();

  // Start at local midnight rangeDays-1 days ago
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(startOfToday);
  startDate.setDate(startOfToday.getDate() - rangeDays + 1);

  // Build an array of day buckets with explicit local start/end and a stable string key
  const allDays = Array.from({ length: rangeDays }, (_, i) => {
    const dayStart = new Date(startDate);
    dayStart.setDate(startDate.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    // Format YYYY-MM-DD using local date parts to avoid UTC shifts
    const dateKey = [
      dayStart.getFullYear(),
      String(dayStart.getMonth() + 1).padStart(2, '0'),
      String(dayStart.getDate()).padStart(2, '0'),
    ].join('-');

    return { dateKey, dayStart, dayEnd };
  });

  return allDays.map(({ dateKey, dayStart, dayEnd }) => {
    const daysSleeps = rawSleepData
      .filter(sleep => {
        const sleepStart = new Date(sleep.start);
        return sleepStart >= dayStart && sleepStart < dayEnd;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let totalDuration = 0;
    const sleepSessions = daysSleeps.map(sleep => {
      const duration = (sleep.end.getTime() - sleep.start.getTime()) / (1000 * 60 * 60);
      totalDuration += duration;
      return {
        startTime: formatTime(sleep.start),
        endTime: formatTime(sleep.end),
        duration,
        quality: sleep.quality
      };
    });

    const stackedData = sleepSessions.map((session, index) => ({
      x: dateKey,
      y: Math.min(session.duration, MAX_SLEEP_HOURS),
      quality: session.quality,
      sessionIndex: index,
      startTime: session.startTime,
      endTime: session.endTime
    }));

    return {
      date: dateKey,
      totalDuration: Math.min(totalDuration, MAX_SLEEP_HOURS),
      actualDuration: totalDuration,
      sessions: stackedData,
      sleepSessions
    };
  });
};

const GraphSkeleton = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: theme.secondaryBackground }]}>
      <View style={styles.skeletonChart}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.skeletonText, { color: theme.secondaryText }]}>Loading sleep data...</Text>
      </View>
    </View>
  );
};

export const SleepVisualization: React.FC<SleepVisualizationProps> = ({ sleepData: rawSleepData, rangeDays, onEditRequest, dataVersion }) => {
  const [selectedBar, setSelectedBar] = useState<any>(null);
  
  // Clear selected bar when data changes
  React.useEffect(() => {
    setSelectedBar(null);
  }, [dataVersion]);
  const [popoutPosition, setPopoutPosition] = useState({ x: 0, y: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ReturnType<typeof processSleepData>>([]);
  const { theme } = useTheme();

  useEffect(() => {
    console.log('[SleepVisualization] Processing sleep data...');
    console.log('...[SleepVisualization] Raw data entries:', rawSleepData?.length || 0);
    console.log('...[SleepVisualization] Range days:', rangeDays);
    
    if (!rawSleepData || rawSleepData.length === 0) {
      console.log('[SleepVisualization] No sleep data available, setting loading to false');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log('[SleepVisualization] Starting data processing...');

    const timer = setTimeout(() => {
      const data = processSleepData(rawSleepData, rangeDays);
      console.log('[SleepVisualization] Data processing completed');
      console.log('...[SleepVisualization] Processed data entries:', data.length);
      console.log('...[SleepVisualization] Data range:', data[0]?.date, 'to', data[data.length - 1]?.date);
      setProcessedData(data);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [rawSleepData, rangeDays]);

  useEffect(() => {
    if (!isLoading && scrollViewRef.current) {
      console.log('[SleepVisualization] Scrolling to current date...');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isLoading]);

  if (!rawSleepData || rawSleepData.length === 0) {
    console.log('[SleepVisualization] Rendering empty state - no sleep data available');
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyStateContainer, { backgroundColor: theme.secondaryBackground }]}>
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            No sleep data available. Please select a child to view their sleep data.
          </Text>
        </View>
      </View>
    );
  }

  console.log('[SleepVisualization] Rendering sleep visualization with', processedData.length, 'processed entries');

  const handleBarPress = (evt: any, target: any) => {
    const nativeEvent = evt.nativeEvent || {};
    const { locationX, locationY } = nativeEvent;

    if (selectedBar?.data?.x === target.datum.x) {
      setSelectedBar(null);
    } else {
      setSelectedBar({
        data: target.datum,
        position: {
          x: locationX - 8,
          y: locationY
        },
      });
    }
  };

  const handleBackgroundPress = () => {
    if (selectedBar) {
      setSelectedBar(null);
    }
  };

  const renderSleepGraph = () => {
    const desiredColumnsPerScreen = 7;
    const yAxisWidth = 42;
    const rightMargin = 25;
    const columnWidth = (screenWidth - yAxisWidth - rightMargin) / desiredColumnsPerScreen;
    const chartWidth = Math.max(screenWidth - yAxisWidth, (rangeDays * columnWidth) + rightMargin);

    if (isLoading) {
      return <GraphSkeleton />;
    }

    return (
      <View style={styles.graphWrapper}>
        <View style={[styles.yAxisContainer, { marginLeft: -8, backgroundColor: theme.secondaryBackground }]}>
          <VictoryAxis
            dependentAxis
            domain={[0, MAX_SLEEP_HOURS]}
            style={{
              tickLabels: { fontSize: 10, padding: 2, fill: theme.text },
              axis: { stroke: theme.text },
              grid: { stroke: theme.secondaryText, strokeWidth: 1 }
            }}
            tickValues={[2, 4, 6, 8, 10, 12, 14, MAX_SLEEP_HOURS]}
            tickFormat={(t: number) => t === 0 ? '0' : `${t}hr`}
            containerComponent={<VictoryContainer responsive={false} />}
            width={yAxisWidth}
            height={300}
            padding={{ top: 20, bottom: 40, left: 35, right: 0 }}
          />
        </View>

        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            style={[styles.graphContainer, { backgroundColor: theme.secondaryBackground }]}
          >
            <VictoryChart
              width={chartWidth}
              height={300}
              padding={{ top: 20, bottom: 40, left: 0, right: 0 }}
              domainPadding={{ x: columnWidth * 0.67 }}
              scale={{ y: "linear" }}
              containerComponent={<VictoryContainer responsive={false} />}
              style={{
                background: { fill: theme.secondaryBackground }
              }}
            >
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: "transparent" },
                  tickLabels: { fill: "transparent" },
                  grid: { stroke: theme.secondaryText, strokeWidth: 1 }
                }}
                tickValues={[0, 2, 4, 6, 8, 10, 12, 14, MAX_SLEEP_HOURS]}
                padding={{ top: 20, bottom: 40, left: 0, right: 0 }}
              />

              {processedData.map((dayData) => (
                <VictoryStack key={dayData.date}>
                  {dayData.sessions.length > 0 ? (
                    dayData.sessions.map((session, sessionIndex) => (
                      <VictoryBar
                        key={`${dayData.date}-${sessionIndex}`}
                        data={[{
                          x: dayData.date,
                          y: session.y,
                          quality: session.quality,
                          actualDuration: dayData.actualDuration,
                          sleepCount: dayData.sessions.length,
                          sleepSessions: dayData.sleepSessions
                        }]}
                        cornerRadius={{top: 5, bottom: 5}}
                        style={{
                          data: {
                            fill: getQualityColor(session.quality),
                            width: columnWidth * 0.7,
                            stroke: selectedBar?.data?.x === dayData.date ? theme.tint : 'transparent',
                            strokeWidth: selectedBar?.data?.x === dayData.date ? 3 : 0,
                            strokeOpacity: 0.8,
                          }
                        }}
                        events={[{
                          target: "data",
                          eventHandlers: {
                            onPressIn: (evt) => handleBarPress(evt, {
                              datum: {
                                x: dayData.date,
                                actualDuration: dayData.actualDuration,
                                quality: session.quality,
                                sleepCount: dayData.sessions.length,
                                sleepSessions: dayData.sleepSessions
                              }
                            })
                          }
                        }]}
                      />
                    ))
                  ) : (
                    <VictoryBar
                      key={`${dayData.date}-empty`}
                      data={[{
                        x: dayData.date,
                        y: 0,
                        quality: 0,
                        actualDuration: 0,
                        sleepCount: 0,
                        sleepSessions: []
                      }]}
                      style={{
                        data: {
                          fill: 'transparent',
                          width: columnWidth * 0.7
                        }
                      }}
                    />
                  )}
                </VictoryStack>
              ))}                

              <VictoryAxis
                tickFormat={(date) => {
                  const d = new Date(`${date}T12:00:00`);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                style={{
                  tickLabels: { fontSize: 10, padding: 5, fill: theme.text },
                  axis: { stroke: theme.text }
                }}
              />
            </VictoryChart>
          </ScrollView>
        </TouchableWithoutFeedback>
        {selectedBar && (
          <BarPopout
            data={selectedBar.data}
            onClose={() => setSelectedBar(null)}
            position={selectedBar.position}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.sleepContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.graphTitle,{ color: theme.text, backgroundColor: theme.secondaryBackground }]}>Sleep Data</Text>
      {renderSleepGraph()}
      
      <View>
        <Text style={[styles.listTitle, { color: theme.text, backgroundColor: theme.secondaryBackground }]}>Sleep Entries</Text>
        {isLoading ? (
          <View style={[styles.loadingListContainer, { backgroundColor: theme.secondaryBackground }]}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading sleep entries...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSleepData(rawSleepData, rangeDays)}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.7} onPress={() => onEditRequest?.(item)}>
                <SleepEntry sleep={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `sleep-${index}`}
            style={[styles.sleepList, { backgroundColor: theme.secondaryBackground }]}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sleepContainer: {
    flex: 1,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  graphWrapper: {
    flexDirection: 'row',
  },
  yAxisContainer: {
    width: 35,
    zIndex: 1,
  },
  graphContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
  },
  sleepList: {
    flex: 1,
  },
  sleepEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
  },
  sleepEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sleepDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  qualityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sleepTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
  },
  sessionTime: {
    flex: 1,
    fontSize: 12,
  },
  sessionDuration: {
    fontSize: 12,
    marginRight: 8,
  },
  barQualityIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barQualityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  popout: {
    position: 'absolute',
    padding: 8,
    borderRadius: 12,
    width: 160,
    borderWidth: 1,
  },
  popoutContent: {
    flex: 1,
  },
  popoutHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  popoutTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  popoutSessionItem: {
    padding: 6,
    marginVertical: 2,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  popoutTimeContainer: {
    flex: 1,
  },
  popoutTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  popoutTime: {
    fontSize: 11,
  },
  popoutDuration: {
    fontSize: 10,
    marginTop: 2,
  },
  popoutQuality: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popoutQualityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  skeletonContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonChart: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skeletonText: {
    marginTop: 10,
    fontSize: 16,
  },
  loadingListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SleepVisualization; 