import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryStack, VictoryContainer } from 'victory-native';
import { ActivityData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';

const MAX_ACTIVITY_COUNT = 10;
const screenWidth = Dimensions.get('window').width;

export interface ActivitySession {
  dateTime: Date;
  type: string;
}

export interface StackedActivityData {
  x: string;
  y: number;
  type: string;
  sessionIndex: number;
  dateTime: Date;
}

export interface DayData {
  date: string;
  totalCount: number;
  actualCount: number;
  sessions: StackedActivityData[];
  activitySessions: ActivitySession[];
  index: number;
}

interface ActivitySessionsListProps {
  sessions: ActivitySession[];
}

interface BarPopoutProps {
  data: {
    x: string;
    actualCount: number;
    type: string;
    activityCount: number;
    activitySessions: ActivitySession[];
  };
  onClose: () => void;
  position: {
    x: number;
    y: number;
  };
}

interface ActivityVisualizationProps {
  activityData: ActivityData[];
  rangeDays: number;
  onEditRequest?: (payload: ActivityData) => void;
  dataVersion?: number;
}

export const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bath': return '#4287f5';
    case 'tummy time': return '#00c896';
    case 'story time': return '#ff9900';
    case 'skin to skin': return '#ff4d4d';
    case 'brush teeth': return '#9c27b0';
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

export const ActivityEntry = ({ activity }: { activity: ActivityData }) => {
  const backgroundColor = getTypeColor(activity.type);
  const { theme } = useTheme();

  return (
    <View style={[
      styles.activityEntry, 
      { 
        borderLeftColor: backgroundColor,
        backgroundColor: theme.secondaryBackground,
        borderBottomColor: theme.tint
      }
    ]}>
      <View style={styles.activityEntryHeader}>
        <Text style={[styles.activityDate, { color: theme.text }]}>{formatDate(activity.dateTime)}</Text>
        <View style={[styles.typeIndicator, { backgroundColor }]}>
          <Text style={styles.typeText}>{activity.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[styles.timeText, { color: theme.secondaryText }]}>
        {formatTime(activity.dateTime)}
      </Text>
    </View>
  );
};

const ActivitySessionsList: React.FC<ActivitySessionsListProps> = ({ sessions }) => (
  <View style={styles.sessionsList}>
    {sessions.map((session, index) => (
      <View 
        key={index} 
        style={[
          styles.sessionItem,
          { borderLeftColor: getTypeColor(session.type) }
        ]}
      >
        <Text style={styles.sessionTime}>
          {formatTime(session.dateTime)}
        </Text>
        <View 
          style={[
            styles.barTypeIndicator,
            { backgroundColor: getTypeColor(session.type) }
          ]}
        >
          <Text style={styles.barTypeText}>{session.type[0].toUpperCase()}</Text>
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
          Total: {data.actualCount} activities
        </Text>
        <View style={styles.sessionsList}>
          {data.activitySessions.map((session, index) => (
            <View 
              key={index} 
              style={[
                styles.popoutSessionItem,
                { 
                  borderLeftColor: getTypeColor(session.type),
                  backgroundColor: theme.secondaryBackground,
                }
              ]}
            >
              <View style={styles.popoutTimeContainer}>
                <View style={styles.popoutTimeRow}>
                  <Text style={[styles.popoutTime, { color: theme.text }]}>
                    {formatTime(session.dateTime)}
                  </Text>
                  <View style={[
                    styles.popoutType,
                    { backgroundColor: getTypeColor(session.type) }
                  ]}>
                    <Text style={styles.popoutTypeText}>{session.type.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const filteredActivityData = (rawActivityData: ActivityData[], rangeDays: number) => {
  // Match the graph's local-day range so activity entries don't disappear
  // near day boundaries or due to UTC/local date mismatches.
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - rangeDays + 1);

  return rawActivityData
    .filter(activity => {
      return activity.dateTime >= startDate && activity.dateTime <= endOfToday;
    })
    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
};

export const processActivityData = (rawActivityData: ActivityData[], rangeDays: number) => {
  // Use local calendar-day boundaries for bucketing so activities don't
  // shift into adjacent days due to UTC/local conversions.
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
    const daysActivities = rawActivityData
      .filter(activity => {
        const activityDate = new Date(activity.dateTime);
        return activityDate >= dayStart && activityDate < dayEnd;
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const activitySessions = daysActivities.map(activity => ({
      dateTime: activity.dateTime,
      type: activity.type
    }));

    const stackedData = activitySessions.map((session, index) => ({
      x: dateKey,
      y: 1,
      type: session.type,
      sessionIndex: index,
      dateTime: session.dateTime
    }));

    return {
      date: dateKey,
      totalCount: Math.min(activitySessions.length, MAX_ACTIVITY_COUNT),
      actualCount: activitySessions.length,
      sessions: stackedData,
      activitySessions
    };
  });
};

const GraphSkeleton = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: theme.secondaryBackground }]}>
      <View style={styles.skeletonChart}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.skeletonText, { color: theme.secondaryText }]}>Loading activity data...</Text>
      </View>
    </View>
  );
};

export const ActivityVisualization: React.FC<ActivityVisualizationProps> = ({ activityData: rawActivityData, rangeDays, onEditRequest, dataVersion }) => {
  const [selectedBar, setSelectedBar] = useState<any>(null);
  
  // Clear selected bar when data changes
  React.useEffect(() => {
    setSelectedBar(null);
  }, [dataVersion]);
  const [popoutPosition, setPopoutPosition] = useState({ x: 0, y: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ReturnType<typeof processActivityData>>([]);
  const { theme } = useTheme();

  useEffect(() => {
    console.log('[ActivityVisualization] Processing activity data...');
    console.log('...[ActivityVisualization] Raw data entries:', rawActivityData?.length || 0);
    console.log('...[ActivityVisualization] Range days:', rangeDays);
    
    if (!rawActivityData || rawActivityData.length === 0) {
      console.log('[ActivityVisualization] No activity data available, setting loading to false');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log('[ActivityVisualization] Starting data processing...');

    const timer = setTimeout(() => {
      const data = processActivityData(rawActivityData, rangeDays);
      console.log('[ActivityVisualization] Data processing completed');
      console.log('...[ActivityVisualization] Processed data entries:', data.length);
      console.log('...[ActivityVisualization] Data range:', data[0]?.date, 'to', data[data.length - 1]?.date);
      setProcessedData(data);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [rawActivityData, rangeDays]);

  useEffect(() => {
    if (!isLoading && scrollViewRef.current) {
      console.log('[ActivityVisualization] Scrolling to current date...');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isLoading]);

  if (!rawActivityData || rawActivityData.length === 0) {
    console.log('[ActivityVisualization] Rendering empty state - no activity data available');
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyStateContainer, { backgroundColor: theme.secondaryBackground }]}>
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            No activity data available. Please select a child to view their activity data.
          </Text>
        </View>
      </View>
    );
  }

  console.log('[ActivityVisualization] Rendering activity visualization with', processedData.length, 'processed entries');

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

  const renderActivityGraph = () => {
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
            domain={[0, MAX_ACTIVITY_COUNT]}
            style={{
              tickLabels: { fontSize: 10, padding: 2, fill: theme.text },
              axis: { stroke: theme.text },
              grid: { stroke: theme.secondaryText, strokeWidth: 1 }
            }}
            tickValues={[2, 4, 6, 8, MAX_ACTIVITY_COUNT]}
            tickFormat={(t: number) => t === 0 ? '0' : `${t}`}
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
                tickValues={[0, 2, 4, 6, 8, MAX_ACTIVITY_COUNT]}
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
                          type: session.type,
                          actualCount: dayData.actualCount,
                          activityCount: dayData.sessions.length,
                          activitySessions: dayData.activitySessions
                        }]}
                        cornerRadius={{top: 5, bottom: 5}}
                        style={{
                          data: {
                            fill: getTypeColor(session.type),
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
                                actualCount: dayData.actualCount,
                                type: session.type,
                                activityCount: dayData.sessions.length,
                                activitySessions: dayData.activitySessions
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
                        type: '',
                        actualCount: 0,
                        activityCount: 0,
                        activitySessions: []
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
    <View style={[styles.activityContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.graphTitle,{ color: theme.text, backgroundColor: theme.secondaryBackground }]}>Activity Data</Text>
      {renderActivityGraph()}

      <View>
        <Text style={[styles.listTitle, { color: theme.text, backgroundColor: theme.secondaryBackground }]}>Activity Entries</Text>
        {isLoading ? (
          <View style={[styles.loadingListContainer, { backgroundColor: theme.secondaryBackground }]}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading activity entries...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredActivityData(rawActivityData, rangeDays)}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.7} onPress={() => onEditRequest?.(item)}>
                <ActivityEntry activity={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `activity-${index}`}
            style={[styles.activityList, { backgroundColor: theme.secondaryBackground }]}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activityContainer: {
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
  activityList: {
    flex: 1,
  },
  activityEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
  },
  activityEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  timeText: {
    fontSize: 14,
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
  barTypeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
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
  popoutType: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popoutTypeText: {
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

export default ActivityVisualization; 