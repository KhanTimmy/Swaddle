import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, TouchableWithoutFeedback, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryStack, VictoryContainer } from 'victory-native';
import { DiaperData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';

const MAX_DIAPER_COUNT = 12;
const screenWidth = Dimensions.get('window').width;

export interface DiaperSession {
  dateTime: Date;
  type: string;
  peeAmount?: string;
  pooAmount?: string;
  pooColor?: string;
  pooConsistency?: string;
  hasRash: boolean;
}

export interface StackedDiaperData {
  x: string;
  y: number;
  type: string;
  sessionIndex: number;
  dateTime: Date;
  peeAmount?: string;
  pooAmount?: string;
  pooColor?: string;
  pooConsistency?: string;
  hasRash: boolean;
}

export interface DayData {
  date: string;
  totalCount: number;
  actualCount: number;
  sessions: StackedDiaperData[];
  diaperSessions: DiaperSession[];
  index: number;
}

interface DiaperSessionsListProps {
  sessions: DiaperSession[];
}

interface BarPopoutProps {
  data: {
    x: string;
    actualCount: number;
    type: string;
    diaperCount: number;
    diaperSessions: DiaperSession[];
  };
  onClose: () => void;
  position: {
    x: number;
    y: number;
  };
}

interface DiaperVisualizationProps {
  diaperData: DiaperData[];
  rangeDays: number;
  onEditRequest?: (payload: DiaperData) => void;
  dataVersion?: number;
}

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'pee': return '#4287f5';
    case 'poo': return '#ff9900';
    case 'mixed': return '#00c896';
    case 'dry': return '#ff4d4d';
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

export const DiaperEntry = ({ diaper }: { diaper: DiaperData }) => {
  const backgroundColor = getTypeColor(diaper.type);
  const { theme } = useTheme();

  return (
    <View style={[
      styles.diaperEntry, 
      { 
        borderLeftColor: backgroundColor,
        backgroundColor: theme.secondaryBackground,
        borderBottomColor: theme.tint
      }
    ]}>
      <View style={styles.diaperEntryHeader}>
        <Text style={[styles.diaperDate, { color: theme.text }]}>{formatDate(diaper.dateTime)}</Text>
        <View style={[styles.typeIndicator, { backgroundColor }]}>
          <Text style={styles.typeText}>{diaper.type.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.diaperDetails}>
        <Text style={[styles.timeText, { color: theme.secondaryText }]}>
          {formatTime(diaper.dateTime)}
        </Text>
        {diaper.peeAmount && (
          <Text style={[styles.detailText, { color: theme.text }]}>Pee: {diaper.peeAmount}</Text>
        )}
        {diaper.pooAmount && (
          <Text style={[styles.detailText, { color: theme.text }]}>Poo: {diaper.pooAmount}</Text>
        )}
        {diaper.pooColor && (
          <Text style={[styles.detailText, { color: theme.text }]}>Color: {diaper.pooColor}</Text>
        )}
        {diaper.pooConsistency && (
          <Text style={[styles.detailText, { color: theme.text }]}>Consistency: {diaper.pooConsistency}</Text>
        )}
        {diaper.hasRash && (
          <Text style={[styles.detailText, { color: '#ff4d4d' }]}>Has Rash</Text>
        )}
      </View>
    </View>
  );
};

const DiaperSessionsList: React.FC<DiaperSessionsListProps> = ({ sessions }) => (
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
        <View style={styles.sessionDetails}>
          <Text style={styles.sessionType}>{session.type}</Text>
          {session.hasRash && (
            <Text style={[styles.rashIndicator, { color: '#ff4d4d' }]}>Rash</Text>
          )}
        </View>
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

  const getPooColor = (color?: string) => {
    switch (color?.toLowerCase()) {
      case 'yellow': return '#ffd700';
      case 'brown': return '#8b4513';
      case 'black': return '#000000';
      case 'green': return '#228b22';
      case 'red': return '#ff0000';
      default: return '#ff9900';
    }
  };

  const renderAmountIndicator = (type: 'pee' | 'poo', amount?: string, pooColor?: string) => {
    if (!amount) return null;
    
    const getFillCount = (amount: string) => {
      switch (amount.toLowerCase()) {
        case 'little': return 1;
        case 'medium': return 2;
        case 'big': return 3;
        default: return 0;
      }
    };

    const fillCount = getFillCount(amount);
    const lines = [1, 2, 3].map((line) => (
      <View
        key={line}
        style={[
          styles.amountLine,
          {
            backgroundColor: line <= fillCount 
              ? (type === 'poo' ? getPooColor(pooColor) : getTypeColor(type))
              : theme.secondaryText,
            opacity: line <= fillCount ? 1 : 0.3
          }
        ]}
      />
    ));

    return (
      <View style={styles.amountContainer}>
        <Text style={[styles.amountLabel, { color: theme.text }]}>
          {type === 'pee' ? 'Pee' : 'Poo'}:
        </Text>
        <View style={styles.amountLinesContainer}>
          {lines}
        </View>
      </View>
    );
  };

  const renderConsistencyIndicator = (consistency?: string) => {
    if (!consistency) return null;
    const abbreviation = consistency.toUpperCase()
    if (!abbreviation) return null;

    return (
      <View style={[styles.consistencyIndicator, { backgroundColor: theme.tint }]}>
        <Text style={styles.consistencyText}>{abbreviation}</Text>
      </View>
    );
  };

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
          Total: {data.actualCount} changes
        </Text>
        <View style={styles.sessionsList}>
          {data.diaperSessions.map((session, index) => (
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
                  <View style={styles.popoutTypeContainer}>
                    {session.hasRash && (
                      <Text style={[styles.rashIndicator, { color: '#ff4d4d' }]}>RASH</Text>
                    )}
                    <View style={[
                      styles.popoutType,
                      { backgroundColor: getTypeColor(session.type) }
                    ]}>
                      <Text style={styles.popoutTypeText}>{session.type.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.popoutDetails}>
                  {renderAmountIndicator('pee', session.peeAmount)}
                  <View style={styles.pooContainer}>
                    {renderAmountIndicator('poo', session.pooAmount, session.pooColor)}
                    {renderConsistencyIndicator(session.pooConsistency)}
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

export const filteredDiaperData = (rawDiaperData: DiaperData[], rangeDays: number) => {
  // Align with the graph's local-day boundaries so all diaper changes in
  // the selected window are listed, including late-evening entries.
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - rangeDays + 1);

  return rawDiaperData
    .filter(diaper => {
      return diaper.dateTime >= startDate && diaper.dateTime <= endOfToday;
    })
    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
};

export const processDiaperData = (rawDiaperData: DiaperData[], rangeDays: number) => {
  // Use local calendar-day boundaries for bucketing so diaper changes
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
    const daysDiapers = rawDiaperData
      .filter(diaper => {
        const diaperDate = new Date(diaper.dateTime);
        return diaperDate >= dayStart && diaperDate < dayEnd;
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const diaperSessions = daysDiapers.map(diaper => ({
      dateTime: diaper.dateTime,
      type: diaper.type,
      peeAmount: diaper.peeAmount,
      pooAmount: diaper.pooAmount,
      pooColor: diaper.pooColor,
      pooConsistency: diaper.pooConsistency,
      hasRash: diaper.hasRash
    }));

    const stackedData = diaperSessions.map((session, index) => ({
      x: dateKey,
      y: 1,
      type: session.type,
      sessionIndex: index,
      dateTime: session.dateTime,
      peeAmount: session.peeAmount,
      pooAmount: session.pooAmount,
      pooColor: session.pooColor,
      pooConsistency: session.pooConsistency,
      hasRash: session.hasRash
    }));

    return {
      date: dateKey,
      totalCount: Math.min(diaperSessions.length, MAX_DIAPER_COUNT),
      actualCount: diaperSessions.length,
      sessions: stackedData,
      diaperSessions
    };
  });
};

const GraphSkeleton = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.skeletonContainer, { backgroundColor: theme.secondaryBackground }]}>
      <View style={styles.skeletonChart}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.skeletonText, { color: theme.secondaryText }]}>Loading diaper data...</Text>
      </View>
    </View>
  );
};

export const DiaperVisualization: React.FC<DiaperVisualizationProps> = ({ diaperData: rawDiaperData, rangeDays, onEditRequest, dataVersion }) => {
  const [selectedBar, setSelectedBar] = useState<any>(null);
  
  // Clear selected bar when data changes
  React.useEffect(() => {
    setSelectedBar(null);
  }, [dataVersion]);
  const [popoutPosition, setPopoutPosition] = useState({ x: 0, y: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ReturnType<typeof processDiaperData>>([]);
  const { theme } = useTheme();

  useEffect(() => {
    console.log('[DiaperVisualization] Processing diaper data...');
    console.log('...[DiaperVisualization] Raw data entries:', rawDiaperData?.length || 0);
    console.log('...[DiaperVisualization] Range days:', rangeDays);
    
    if (!rawDiaperData || rawDiaperData.length === 0) {
      console.log('[DiaperVisualization] No diaper data available, setting loading to false');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log('[DiaperVisualization] Starting data processing...');

    const timer = setTimeout(() => {
      const data = processDiaperData(rawDiaperData, rangeDays);
      console.log('[DiaperVisualization] Data processing completed');
      console.log('...[DiaperVisualization] Processed data entries:', data.length);
      console.log('...[DiaperVisualization] Data range:', data[0]?.date, 'to', data[data.length - 1]?.date);
      setProcessedData(data);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [rawDiaperData, rangeDays]);

  useEffect(() => {
    if (!isLoading && scrollViewRef.current) {
      console.log('[DiaperVisualization] Scrolling to current date...');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isLoading]);

  if (!rawDiaperData || rawDiaperData.length === 0) {
    console.log('[DiaperVisualization] Rendering empty state - no diaper data available');
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyStateContainer, { backgroundColor: theme.secondaryBackground }]}>
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            No diaper data available. Please select a child to view their diaper data.
          </Text>
        </View>
      </View>
    );
  }

  console.log('[DiaperVisualization] Rendering diaper visualization with', processedData.length, 'processed entries');

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

  const renderDiaperGraph = () => {
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
            domain={[0, MAX_DIAPER_COUNT]}
            style={{
              tickLabels: { fontSize: 10, padding: 2, fill: theme.text },
              axis: { stroke: theme.text },
              grid: { stroke: theme.secondaryText, strokeWidth: 1 }
            }}
            tickValues={[2, 4, 6, 8, 10, MAX_DIAPER_COUNT]}
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
                tickValues={[0, 2, 4, 6, 8, 10, MAX_DIAPER_COUNT]}
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
                          diaperCount: dayData.sessions.length,
                          diaperSessions: dayData.diaperSessions
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
                                diaperCount: dayData.sessions.length,
                                diaperSessions: dayData.diaperSessions
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
                        diaperCount: 0,
                        diaperSessions: []
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
    <View style={[styles.diaperContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.graphTitle,{ color: theme.text, backgroundColor: theme.secondaryBackground }]}>Diaper Data</Text>
      {renderDiaperGraph()}

      <View>
        <Text style={[styles.listTitle, { color: theme.text, backgroundColor: theme.secondaryBackground }]}>Diaper Entries</Text>
        {isLoading ? (
          <View style={[styles.loadingListContainer, { backgroundColor: theme.secondaryBackground }]}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading diaper entries...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDiaperData(rawDiaperData, rangeDays)}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.7} onPress={() => onEditRequest?.(item)}>
                <DiaperEntry diaper={item} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `diaper-${index}`}
            style={[styles.diaperList, { backgroundColor: theme.secondaryBackground }]}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  diaperContainer: {
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
  diaperList: {
    flex: 1,
  },
  diaperEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
  },
  diaperEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  diaperDate: {
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
  diaperDetails: {
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    marginVertical: 2,
  },
  sessionsList: {
    gap: 4,
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
  sessionDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionType: {
    fontSize: 12,
  },
  rashIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
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
  popoutDetails: {
    marginTop: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '500',
    width: 30,
  },
  amountLinesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  amountLine: {
    height: 3,
    width: 12,
    borderRadius: 1.5,
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
  pooContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  consistencyIndicator: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  consistencyText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
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

export default DiaperVisualization; 