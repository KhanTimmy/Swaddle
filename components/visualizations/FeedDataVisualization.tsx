import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryStack, VictoryContainer } from 'victory-native';
import { FeedData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';

const MAX_FEED_DURATION = 90;
const screenWidth = Dimensions.get('window').width;

export interface FeedSession {
  dateTime: Date;
  type: string;
  amount?: number;
  side?: string;
  notes?: string;
  description?: string;
  duration: number;
}

export interface StackedFeedData {
  x: string;
  y: number;
  type: string;
  sessionIndex: number;
  dateTime: Date;
  amount: number;
  side?: string;
}

export interface DayData {
  date: string;
  totalDuration: number;
  actualDuration: number;
  sessions: StackedFeedData[];
  feedSessions: FeedSession[];
  index: number;
}

interface FeedSessionsListProps {
  sessions: FeedSession[];
}

export interface BarPopoutProps {
  data: {
    x: string;
    actualDuration: number;
    type: string;
    feedCount: number;
    feedSessions: FeedSession[];
  };
  onClose: () => void;
  position: {
    x: number;
    y: number;
  };
}

interface FeedVisualizationProps {
  feedData: FeedData[];
  rangeDays: number;
  onEditRequest?: (payload: FeedData) => void;
  dataVersion?: number;
}

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'nursing': return '#ff9900';
    case 'bottle': return '#ff4d4d';
    case 'solid': return '#00c896';
    default: return '#4287f5';
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

export const FeedEntry = ({ feed }: { feed: FeedData }) => {
  const backgroundColor = getTypeColor(feed.type);
  const { theme } = useTheme();

  return (
    <View style={[
      styles.feedEntry, 
      { 
        borderLeftColor: backgroundColor,
        backgroundColor: theme.secondaryBackground,
        borderBottomColor: theme.tint
      }
    ]}>
      <View style={styles.feedEntryHeader}>
        <Text style={[styles.feedDate, { color: theme.text }]}>{formatDate(feed.dateTime)}</Text>
        <View style={styles.typeContainer}>
          <View style={[styles.typeIndicator, { backgroundColor }]}>
            <Text style={styles.typeText}>{feed.type.toUpperCase()}</Text>
          </View>
          {feed.type === 'nursing' && feed.side && (
            <View style={[styles.sideIndicator, { backgroundColor: theme.tint }]}>
              <Text style={styles.sideText}>{feed.side.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.feedTimes}>
        <Text style={[styles.timeText, { color: theme.secondaryText }]}>
          {formatTime(feed.dateTime)}
        </Text>
        <Text style={[styles.durationText, { color: theme.text }]}>
          {feed.type === 'nursing' 
            ? `Duration: ${feed.duration} minutes`
            : `Amount: ${feed.amount} oz`}
        </Text>
      </View>
      {feed.notes && (
        <Text style={[styles.notesText, { color: theme.secondaryText }]}>Notes: {feed.notes}</Text>
      )}
    </View>
  );
};

const FeedSessionsList: React.FC<FeedSessionsListProps> = ({ sessions }) => (
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
        <Text style={styles.sessionDuration}>
          {session.type === 'nursing' 
            ? `${session.duration}min`
            : `${session.amount}oz`}
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

export const BarPopout: React.FC<BarPopoutProps> = ({ data, onClose, position }) => {
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
          Total: {data.actualDuration}min
        </Text>
        <View style={styles.sessionsList}>
          {data.feedSessions.map((session, index) => (
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View 
                      style={[
                        styles.popoutType,
                        { backgroundColor: getTypeColor(session.type) }
                      ]}
                    >
                      <Text style={styles.popoutTypeText}>{session.type.toUpperCase()}</Text>
                    </View>
                    {session.type === 'nursing' && session.side && (
                      <View style={[styles.popoutSide, { backgroundColor: theme.tint }]}>
                        <Text style={styles.popoutSideText}>{session.side.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.popoutDuration, { color: theme.text }]}>
                  {session.type === 'nursing' 
                    ? `Duration: ${session.duration}min`
                    : `Amount: ${session.amount}oz`}
                </Text>
                {session.notes && (
                  <Text style={[styles.popoutNotes, { color: theme.secondaryText }]}>
                    Notes: {session.notes}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const filteredFeedData = (rawFeedData: FeedData[], rangeDays: number) => {
  // Align list filtering with the graph's local-day window so all feeds
  // in the selected range remain visible and tappable.
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - rangeDays + 1);

  return rawFeedData
    .filter(feed => {
      return feed.dateTime >= startDate && feed.dateTime <= endOfToday;
    })
    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
};

export const processFeedData = (rawFeedData: FeedData[], rangeDays: number) => {
  // Use local calendar-day boundaries for bucketing so feeds don't "bleed"
  // into adjacent days due to timezone conversion between UTC and local time.
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
    const daysFeeds = rawFeedData
      .filter(feed => {
        const feedDate = new Date(feed.dateTime);
        return feedDate >= dayStart && feedDate < dayEnd;
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    let totalDuration = 0;
    const feedSessions = daysFeeds.map(feed => {
      let duration = 0;
      if (feed.type === 'nursing') {
        duration = 15;
      } else if (feed.type === 'bottle' || feed.type === 'solid') {
        duration = 10;
      }
      
      totalDuration += duration;
      return {
        dateTime: feed.dateTime,
        type: feed.type,
        amount: feed.amount,
        side: feed.side,
        notes: feed.notes,
        description: feed.description,
        duration
      };
    });

    const stackedData = feedSessions.map((session, index) => ({
      x: dateKey,
      y: Math.min(session.duration, MAX_FEED_DURATION),
      type: session.type,
      sessionIndex: index,
      dateTime: session.dateTime,
      amount: session.amount,
      side: session.side
    }));

    return {
      date: dateKey,
      totalDuration: Math.min(totalDuration, MAX_FEED_DURATION),
      actualDuration: totalDuration,
      sessions: stackedData,
      feedSessions
    };
  });
};

const GraphSkeleton = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: theme.secondaryBackground }]}>
      <View style={styles.skeletonChart}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.skeletonText, { color: theme.secondaryText }]}>Loading feed data...</Text>
      </View>
    </View>
  );
};

export const FeedVisualization: React.FC<FeedVisualizationProps> = ({ feedData: rawFeedData, rangeDays, onEditRequest, dataVersion }) => {
  const [selectedBar, setSelectedBar] = useState<any>(null);
  
  // Clear selected bar when data changes
  React.useEffect(() => {
    setSelectedBar(null);
  }, [dataVersion]);
  const [popoutPosition, setPopoutPosition] = useState({ x: 0, y: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ReturnType<typeof processFeedData>>([]);
  const { theme } = useTheme();

  useEffect(() => {
    console.log('[FeedVisualization] Processing feed data...');
    console.log('...[FeedVisualization] Raw data entries:', rawFeedData?.length || 0);
    console.log('...[FeedVisualization] Range days:', rangeDays);
    
    if (!rawFeedData || rawFeedData.length === 0) {
      console.log('[FeedVisualization] No feed data available, setting loading to false');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log('[FeedVisualization] Starting data processing...');

    const timer = setTimeout(() => {
      const data = processFeedData(rawFeedData, rangeDays);
      console.log('[FeedVisualization] Data processing completed');
      console.log('...[FeedVisualization] Processed data entries:', data.length);
      console.log('...[FeedVisualization] Data range:', data[0]?.date, 'to', data[data.length - 1]?.date);
      setProcessedData(data);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [rawFeedData, rangeDays]);

  useEffect(() => {
    if (!isLoading && scrollViewRef.current) {
      console.log('[FeedVisualization] Scrolling to current date...');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isLoading]);

  if (!rawFeedData || rawFeedData.length === 0) {
    console.log('[FeedVisualization] Rendering empty state - no feed data available');
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyStateContainer, { backgroundColor: theme.secondaryBackground }]}>
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            No feeding data available. Please select a child to view their feeding data.
          </Text>
        </View>
      </View>
    );
  }

  console.log('[FeedVisualization] Rendering feed visualization with', processedData.length, 'processed entries');

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

  const renderFeedGraph = () => {
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
            domain={[0, MAX_FEED_DURATION]}
            style={{
              tickLabels: { fontSize: 10, padding: 2, fill: theme.text },
              axis: { stroke: theme.text },
              grid: { stroke: theme.secondaryText, strokeWidth: 1 }
            }}
            tickValues={[15, 30, 45, 60, 75, MAX_FEED_DURATION]}
            tickFormat={(t: number) => t === 0 ? '0' : `${t}m`}
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
                tickValues={[15, 30, 45, 60, 75, MAX_FEED_DURATION]}
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
                          actualDuration: dayData.actualDuration,
                          feedCount: dayData.sessions.length,
                          feedSessions: dayData.feedSessions
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
                                actualDuration: dayData.actualDuration,
                                type: session.type,
                                feedCount: dayData.sessions.length,
                                feedSessions: dayData.feedSessions
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
                        actualDuration: 0,
                        feedCount: 0,
                        feedSessions: []
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
    <View style={[styles.feedContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.graphTitle,{ color: theme.text, backgroundColor: theme.secondaryBackground }]}>Feed Data</Text>
      {renderFeedGraph()}

      <View>
        <Text style={[styles.listTitle, { color: theme.text, backgroundColor: theme.secondaryBackground }]}>Feed Entries</Text>
        {isLoading ? (
          <View style={[styles.loadingListContainer, { backgroundColor: theme.secondaryBackground }]}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading feed entries...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFeedData(rawFeedData, rangeDays)}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.7} onPress={() => onEditRequest?.(item)}>
                <FeedEntry feed={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `feed-${index}`}
            style={[styles.feedList, { backgroundColor: theme.secondaryBackground }]}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
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
  feedList: {
    flex: 1,
  },
  feedEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
  },
  feedEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  sideIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sideText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  feedTimes: {
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
  notesText: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
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
  popoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  popoutSide: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popoutSideText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  popoutDuration: {
    fontSize: 11,
  },
  popoutNotes: {
    fontSize: 11,
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

export default FeedVisualization; 