import React, { useRef } from 'react';
import { View, ScrollView } from 'react-native';
import { SleepData, FeedData, DiaperData, ActivityData, MilestoneData, WeightData } from '@/services/ChildService';
import type { TrendType } from './TrendSelector';
import SleepVisualization from './visualizations/SleepDataVisualization';
import FeedVisualization from './visualizations/FeedDataVisualization';
import DiaperVisualization from './visualizations/DiaperDataVisualization';
import ActivityVisualization from './visualizations/ActivityDataVisualization';
import MilestoneVisualization from './visualizations/MilestoneDataVisualization';
import WeightVisualization from './visualizations/WeightDataVisualization';

interface UnifiedDataGraphProps {
  sleepData: SleepData[];
  feedData: FeedData[];
  diaperData: DiaperData[];
  activityData: ActivityData[];
  milestoneData: MilestoneData[];
  weightData: WeightData[];
  rangeDays: number;
  activeDataType: TrendType;
  onEditRequest?: (params: { type: TrendType; payload: any }) => void;
  dataVersion?: number;
}

const UnifiedDataGraph = ({
  sleepData: rawSleepData,
  feedData: rawFeedData,
  diaperData: rawDiaperData,
  activityData: rawActivityData,
  milestoneData: rawMilestoneData,
  weightData: rawWeightData,
  rangeDays,
  activeDataType,
  onEditRequest,
  dataVersion,
}: UnifiedDataGraphProps) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScrollView>
      <View>
        {activeDataType === 'sleep' && (
          <SleepVisualization sleepData={rawSleepData} rangeDays={rangeDays} onEditRequest={(payload: any) => onEditRequest?.({ type: 'sleep', payload })} dataVersion={dataVersion} />
        )}
        {activeDataType === 'feed' && (
          <FeedVisualization feedData={rawFeedData} rangeDays={rangeDays} onEditRequest={(payload: any) => onEditRequest?.({ type: 'feed', payload })} dataVersion={dataVersion} />
        )}
        {activeDataType === 'diaper' && (
          <DiaperVisualization diaperData={rawDiaperData} rangeDays={rangeDays} onEditRequest={(payload: any) => onEditRequest?.({ type: 'diaper', payload })} dataVersion={dataVersion} />
        )}
        {activeDataType === 'activity' && (
          <ActivityVisualization activityData={rawActivityData} rangeDays={rangeDays} onEditRequest={(payload: any) => onEditRequest?.({ type: 'activity', payload })} dataVersion={dataVersion} />
        )}
        {activeDataType === 'milestone' && (
          <MilestoneVisualization
            milestoneData={rawMilestoneData}
            rangeDays={rangeDays}
            onEditRequest={(payload: any) => onEditRequest?.({ type: 'milestone', payload })}
            dataVersion={dataVersion}
          />
        )}
        {activeDataType === 'weight' && (
          <WeightVisualization weightData={rawWeightData} rangeDays={rangeDays} onEditRequest={(payload: any) => onEditRequest?.({ type: 'weight', payload })} dataVersion={dataVersion} />
        )}
      </View>
    </ScrollView>
  );
};

export default UnifiedDataGraph; 