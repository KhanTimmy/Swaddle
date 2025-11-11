import { 
    collection, 
    getDocs, 
    query, 
    where, 
    addDoc, 
    deleteDoc, 
    updateDoc, 
    arrayRemove,
    doc 
  } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { db } from '@/firebase.config';
  import AsyncStorage from '@react-native-async-storage/async-storage';

let queryCounter = 0;
let currentChildId: string | null = null;

const CACHE_KEYS = {
  FEED: 'childData_feed_',
  SLEEP: 'childData_sleep_',
  DIAPER: 'childData_diaper_',
  ACTIVITY: 'childData_activity_',
  MILESTONE: 'childData_milestone_',
  WEIGHT: 'childData_weight_',
  LAST_FETCH: 'childData_lastFetch_'
};

const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = async (childId: string): Promise<boolean> => {
  try {
    const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH + childId);
    if (!lastFetch) return false;
    
    const lastFetchTime = parseInt(lastFetch);
    const now = Date.now();
    return (now - lastFetchTime) < CACHE_DURATION;
  } catch (error) {
    console.error('[Cache] Error checking cache validity:', error);
    return false;
  }
};

const updateCacheTimestamp = async (childId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH + childId, Date.now().toString());
  } catch (error) {
    console.error('[Cache] Error updating cache timestamp:', error);
  }
};

const clearChildCache = async (childId: string): Promise<void> => {
  try {
    const keys = [
      CACHE_KEYS.FEED + childId,
      CACHE_KEYS.SLEEP + childId,
      CACHE_KEYS.DIAPER + childId,
      CACHE_KEYS.ACTIVITY + childId,
      CACHE_KEYS.MILESTONE + childId,
      CACHE_KEYS.WEIGHT + childId,
      CACHE_KEYS.LAST_FETCH + childId
    ];
    await AsyncStorage.multiRemove(keys);
    console.log(`[Cache] Cleared cache for child: ${childId}`);
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
};

const resetQueryCounter = (childId: string | null) => {
  if (currentChildId !== childId) {
    if (currentChildId !== null) {
      console.log(`[QueryCounter] Child changed from ${currentChildId} to ${childId || 'none'}. Resetting counter.`);
    }
    queryCounter = 0;
    currentChildId = childId;
    if (childId) {
      console.log(`[QueryCounter] New child selected: ${childId}. Counter reset to 0.`);
    } else {
      console.log(`[QueryCounter] No child selected. Counter reset to 0.`);
    }
  }
};

const incrementQueryCounter = (operation: string, childId?: string) => {
  if (childId) {
    resetQueryCounter(childId);
  }
  queryCounter++;
  console.log(`[QueryCounter] ${operation} - Total queries for current child: ${queryCounter}`);
};

export { resetQueryCounter, clearChildCache };

export interface ChildData {
  id: string;
  first_name: string;
  last_name: string;
  type: string;
  dob: string;
  sex: 'male' | 'female';
  weight?: {
    pounds: number;
    ounces: number;
  };
}

export interface NewChildData {
  first_name: string;
  last_name: string;
  dob: string;
  sex: string;
  weight?: {
    pounds: number;
    ounces: number;
  };
}

export interface SleepData {
  id: string;
  docId?: string;
  start: Date;
  end: Date;
  quality: number;
}

export interface FeedData {
  id: string;
  docId?: string;
  amount: number;
  dateTime: Date;
  description: string;
  duration: number;
  notes: string;
  type: 'nursing' | 'bottle' | 'solid';
  side?: 'left' | 'right';
}

export interface DiaperData {
  id: string;
  docId?: string;
  dateTime: Date;
  type: 'pee' | 'poo' | 'mixed' | 'dry';
  peeAmount?: 'little' | 'medium' | 'big';
  pooAmount?: 'little' | 'medium' | 'big';
  pooColor?: 'yellow' | 'brown' | 'black' | 'green' | 'red';
  pooConsistency?: 'solid' | 'loose' | 'runny' | 'mucousy' | 'hard' | 'pebbles' | 'diarrhea';
  hasRash: boolean;
}

export interface ActivityData {
  id: string;
  docId?: string;
  dateTime: Date;
  type: 'bath' | 'tummy time' | 'story time' | 'skin to skin' | 'brush teeth';
}

export interface MilestoneData {
  id: string;
  docId?: string;
  dateTime: Date;
  type: 'smiling' | 'rolling over' | 'sitting up' | 'crawling' | 'walking';
}

export interface WeightData {
  id: string;
  docId?: string;
  dateTime: Date;
  pounds: number;
  ounces: number;
}

export const ChildService = {
  async fetchUserChildren(): Promise<ChildData[]> {
    const user = getAuth().currentUser;
    if (!user || !user.email) return [];
    console.log('[ChildService]fetchUserChildren executing');
    console.log('...[fetchUserChildren] fetching children for user email:', user.email);
    
    try {
      const childrenCollection = collection(db, 'children');
      console.log('...[fetchUserChildren] accessing "children" collection from Firestore');

      const authorizedQuery = query(childrenCollection, where('authorized_uid', 'array-contains', user.email));
      const parentQuery = query(childrenCollection, where('parent_uid', '==', user.email));
    
      const authorizedSnapshot = await getDocs(authorizedQuery);
      const parentSnapshot = await getDocs(parentQuery);
    
      let childrenFound: ChildData[] = [];

      parentSnapshot.forEach((doc) => {
        const parentChildData = doc.data();
        if (parentChildData.parent_uid) {
          childrenFound.push({
            id: doc.id,
            first_name: parentChildData.first_name,
            last_name: parentChildData.last_name,
            type: 'Parent',
            dob: parentChildData.dob,
            sex: parentChildData.sex,
            weight: parentChildData.weight,
          });
        }
      });

      authorizedSnapshot.forEach((doc) => {
        const authChildData = doc.data();
        if (authChildData.authorized_uid) {
          childrenFound.push({
            id: doc.id,
            first_name: authChildData.first_name,
            last_name: authChildData.last_name,
            type: 'Authorized',
            dob: authChildData.dob,
            sex: authChildData.sex,
            weight: authChildData.weight,
          });
        }
      });
      console.log('[ChildService]fetchUserChildren completed');
      return childrenFound;
    } catch (error) {
      console.error('[ChildService]fetchUserChildren error occurred:', error);
      throw error;
    }
  },

  async addChild(childData: NewChildData): Promise<ChildData> {
    console.log('[ChildService]addChild executing');
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addChild failed: user not authenticated');
      throw new Error('User must be logged in to add child');
    }

    try {
      const docData: any = {
        first_name: childData.first_name,
        last_name: childData.last_name,
        dob: childData.dob,
        sex: childData.sex,
        parent_uid: user.email,
        authorized_uid: [],
      };
      
      if (childData.weight) {
        docData.weight = childData.weight;
      }
      
      const docRef = await addDoc(collection(db, 'children'), docData);
      console.log(`...[addChild] child created: ${docRef.id}`);
      
      // If weight is provided, also add it to the weight subcollection
      if (childData.weight) {
        const birthDate = new Date(childData.dob);
        await addDoc(collection(db, 'children', docRef.id, 'weight'), {
          dateTime: birthDate,
          pounds: childData.weight.pounds,
          ounces: childData.weight.ounces
        });
        console.log(`...[addChild] initial weight added to subcollection for child: ${docRef.id}`);
        await clearChildCache(docRef.id);
      }
      
      return {
        first_name: childData.first_name,
        last_name: childData.last_name,
        type: 'Parent',
        id: docRef.id,
        dob: childData.dob,
        sex: childData.sex as "male" | "female",
        weight: childData.weight,
      };
    } catch (error) {
      console.error('[ChildService]addChild error occurred:', error);
      throw error;
    }
  },

  async removeChildOrAccess(child: ChildData): Promise<void> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]removeChildOrAccess failed: user not authenticated');
      throw new Error('User must be logged in to remove child or access');
    }

    try {
      if (child.type === 'Parent') {
        const childDocRef = doc(db, 'children', child.id);
        await deleteDoc(childDocRef);
        console.log(`...[removeChildOrAccess] child removed: ${child.id}`);
      } else if (child.type === 'Authorized') {
        const childDocRef = doc(db, 'children', child.id);
        await updateDoc(childDocRef, {
          authorized_uid: arrayRemove(user.email),
        });
        console.log(`...[removeChildOrAccess] access removed: ${child.id}`);
      }
    } catch (error) {
      console.error('[ChildService]removeChildOrAccess error occurred:', error);
      throw error;
    }
  },

  async addSleep(sleepData: SleepData): Promise<SleepData> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addSleep failed: user not authenticated');
      throw new Error('User must be logged in to add sleep data');
    }
    try {
      const docRef = await addDoc(collection(db, 'children', sleepData.id, 'sleep'), {
        start: sleepData.start,
        end: sleepData.end,
        quality: sleepData.quality
      });
      console.log(`...[addSleep] data created: ${sleepData.id}`);

      await clearChildCache(sleepData.id);
      
      return {
        id: sleepData.id,
        start: sleepData.start,
        end: sleepData.end,
        quality: sleepData.quality,
      }
    } catch (error) {
      console.error('[ChildService]addSleep error occurred:', error);
      throw error;
    }
  },

  async addFeed(feedData: FeedData): Promise<FeedData> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addFeed failed: user not authenticated');
      throw new Error('User must be logged in to add feed data');
    }
    try {
      const docRef = await addDoc(collection(db, 'children', feedData.id, 'feed'), {
        amount: feedData.amount,
        dateTime: feedData.dateTime,
        description: feedData.description,
        duration: feedData.duration,
        notes: feedData.notes,
        type: feedData.type,
        ...(feedData.type === 'nursing' && feedData.side ? { side: feedData.side } : {})
      });
      console.log(`...[addFeed] data created: ${feedData.id}`);

      await clearChildCache(feedData.id);
      
      return {
        id: feedData.id,
        amount: feedData.amount,
        dateTime: feedData.dateTime,
        description: feedData.description,
        duration: feedData.duration,
        notes: feedData.notes,
        type: feedData.type,
        ...(feedData.type === 'nursing' && feedData.side ? { side: feedData.side } : {}),
      };
    } catch (error) {
      console.error('[ChildService]addFeed error occurred:', error);
      throw error;
    }
  },

  async addDiaper(diaperData: DiaperData): Promise<DiaperData> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addDiaper failed: user not authenticated');
      throw new Error('User must be logged in to add diaper data');
    }
  
    try {
      const docRef = await addDoc(collection(db, 'children', diaperData.id, 'diaper'), {
        dateTime: diaperData.dateTime,
        type: diaperData.type,
        hasRash: diaperData.hasRash,
        ...(diaperData.type === 'mixed' || diaperData.type === 'pee' && diaperData.peeAmount ? {peeAmount: diaperData.peeAmount } : {}),
        ...(diaperData.type === 'mixed' || diaperData.type === 'poo' && diaperData.pooAmount ? {pooAmount: diaperData.pooAmount } : {}),
        ...(diaperData.type === 'mixed' || diaperData.type === 'poo' && diaperData.pooColor ? {pooColor: diaperData.pooColor } : {}),
        ...(diaperData.type === 'mixed' || diaperData.type === 'poo' && diaperData.pooConsistency ? {pooConsistency: diaperData.pooConsistency } : {})
      });
      console.log(`...[addDiaper] data created: ${diaperData.id}`);

      await clearChildCache(diaperData.id);
      
      return {
        id: diaperData.id,
        dateTime: diaperData.dateTime,
        type: diaperData.type,
        peeAmount: diaperData.peeAmount,
        pooAmount: diaperData.pooAmount,
        pooColor: diaperData.pooColor,
        pooConsistency: diaperData.pooConsistency,
        hasRash: diaperData.hasRash
      };
    } catch (error) {
      console.error('[ChildService]addDiaper error occurred:', error);
      throw error;
    }
  },

  async addActivity(activityData: ActivityData): Promise<ActivityData> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addActivity failed: user not authenticated');
      throw new Error('User must be logged in to add activity data');
    }
  
    try {
      const docRef = await addDoc(collection(db, 'children', activityData.id, 'activity'), {
        dateTime: activityData.dateTime,
        type: activityData.type
      });
      console.log(`...[addActivity] data created: ${activityData.id}`);

      await clearChildCache(activityData.id);
      
      return {
        id: activityData.id,
        dateTime: activityData.dateTime,
        type: activityData.type,
      };
    } catch (error) {
      console.error('[ChildService]addActivity error occurred:', error);
      throw error;
    }
  },

  async addMilestone(milestoneData: MilestoneData): Promise<MilestoneData> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addMilestone failed: user not authenticated');
      throw new Error('User must be logged in to add milestone data');
    }
  
    try {
      const docRef = await addDoc(collection(db, 'children', milestoneData.id, 'milestone'), {
        dateTime: milestoneData.dateTime,
        type: milestoneData.type
      });
      console.log(`...[addMilestone] data created: ${milestoneData.id}`);

      await clearChildCache(milestoneData.id);
      
      return {
        id: milestoneData.id,
        dateTime: milestoneData.dateTime,
        type: milestoneData.type,
      };
    } catch (error) {
      console.error('[ChildService]addMilestone error occurred:', error);
      throw error;
    }
  },

  async addWeight(weightData: WeightData): Promise<WeightData> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]addWeight failed: user not authenticated');
      throw new Error('User must be logged in to add weight data');
    }
  
    try {
      const docRef = await addDoc(collection(db, 'children', weightData.id, 'weight'), {
        dateTime: weightData.dateTime,
        pounds: weightData.pounds,
        ounces: weightData.ounces
      });
      console.log(`...[addWeight] data created: ${weightData.id}`);

      await clearChildCache(weightData.id);
      
      return {
        id: weightData.id,
        dateTime: weightData.dateTime,
        pounds: weightData.pounds,
        ounces: weightData.ounces,
      };
    } catch (error) {
      console.error('[ChildService]addWeight error occurred:', error);
      throw error;
    }
  },

  async getSleep(childId: string): Promise<SleepData[]> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]getSleep failed: user not authenticated');
      throw new Error('User must be logged in to get sleep data');
    }
    try {
      console.log('[ChildService]getSleep executing for childId:', childId);

      if (await isCacheValid(childId)) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.SLEEP + childId);
        if (cachedData) {
          console.log('[Cache] Returning cached sleep data');
          const parsedData = JSON.parse(cachedData);
          return parsedData.map((sleep: any) => ({
            ...sleep,
            start: new Date(sleep.start),
            end: new Date(sleep.end)
          }));
        }
      }

      incrementQueryCounter('getSleep', childId);
      const sleepCollection = collection(db, 'children', childId, 'sleep');
      const snapshot = await getDocs(sleepCollection);
      console.log(`...[getSleep] sleep data returned with ${snapshot.docs.length} entries`);
      
      const data = snapshot.docs.map((d) => ({
        ...(d.data() as any),
        docId: d.id,
        start: d.data().start.toDate(),
        end: d.data().end.toDate()
      })) as SleepData[];

      await AsyncStorage.setItem(CACHE_KEYS.SLEEP + childId, JSON.stringify(data));
      await updateCacheTimestamp(childId);
      console.log('[Cache] Cached sleep data');
      
      return data;
    } catch (error) {
      console.error('[ChildService]getSleep error occurred:', error);
      throw error;
    }
  },

  async getFeed(childId: string): Promise<FeedData[]> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]getFeed failed: user not authenticated');
      throw new Error('User must be logged in to get feed data');
    }
    try {
      console.log('[ChildService]getFeed executing for childId:', childId);

      if (await isCacheValid(childId)) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.FEED + childId);
        if (cachedData) {
          console.log('[Cache] Returning cached feed data');
          const parsedData = JSON.parse(cachedData);
          return parsedData.map((feed: any) => ({
            ...feed,
            dateTime: new Date(feed.dateTime)
          }));
        }
      }

      incrementQueryCounter('getFeed', childId);
      const feedCollection = collection(db, 'children', childId, 'feed');
      const snapshot = await getDocs(feedCollection);
      console.log(`...[getFeed] feed data returned with ${snapshot.docs.length} entries`);
      
      const data = snapshot.docs.map((d) => ({
        ...(d.data() as any),
        docId: d.id,
        dateTime: d.data().dateTime.toDate()
      })) as FeedData[];

      await AsyncStorage.setItem(CACHE_KEYS.FEED + childId, JSON.stringify(data));
      await updateCacheTimestamp(childId);
      console.log('[Cache] Cached feed data');
      
      return data;
    } catch (error) {
      console.error('[ChildService]getFeed error occurred:', error);
      throw error;
    }
  },

  async getDiaper(childId: string): Promise<DiaperData[]> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]getDiaper failed: user not authenticated');
      throw new Error('User must be logged in to get diaper data');
    }
    try {
      console.log('[ChildService]getDiaper executing for childId:', childId);

      if (await isCacheValid(childId)) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.DIAPER + childId);
        if (cachedData) {
          console.log('[Cache] Returning cached diaper data');
          const parsedData = JSON.parse(cachedData);
          return parsedData.map((diaper: any) => ({
            ...diaper,
            dateTime: new Date(diaper.dateTime)
          }));
        }
      }

      incrementQueryCounter('getDiaper', childId);
      const diaperCollection = collection(db, 'children', childId, 'diaper');
      const snapshot = await getDocs(diaperCollection);
      console.log(`...[getDiaper] diaper data returned with ${snapshot.docs.length} entries`);
      
      const data = snapshot.docs.map((d) => ({
        ...(d.data() as any),
        docId: d.id,
        dateTime: d.data().dateTime.toDate()
      })) as DiaperData[];

      await AsyncStorage.setItem(CACHE_KEYS.DIAPER + childId, JSON.stringify(data));
      await updateCacheTimestamp(childId);
      console.log('[Cache] Cached diaper data');
      
      return data;
    } catch (error) {
      console.error('[ChildService]getDiaper error occurred:', error);
      throw error;
    }
  },

  async getActivity(childId: string): Promise<ActivityData[]> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]getActivity failed: user not authenticated');
      throw new Error('User must be logged in to get activity data');
    }
    try {
      console.log('[ChildService]getActivity executing for childId:', childId);

      if (await isCacheValid(childId)) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.ACTIVITY + childId);
        if (cachedData) {
          console.log('[Cache] Returning cached activity data');
          const parsedData = JSON.parse(cachedData);
          return parsedData.map((activity: any) => ({
            ...activity,
            dateTime: new Date(activity.dateTime)
          }));
        }
      }

      incrementQueryCounter('getActivity', childId);
      const activityCollection = collection(db, 'children', childId, 'activity');
      const snapshot = await getDocs(activityCollection);
      console.log(`...[getActivity] activity data returned with ${snapshot.docs.length} entries`);
      
      const data = snapshot.docs.map((d) => ({
        ...(d.data() as any),
        docId: d.id,
        dateTime: d.data().dateTime.toDate()
      })) as ActivityData[];

      await AsyncStorage.setItem(CACHE_KEYS.ACTIVITY + childId, JSON.stringify(data));
      await updateCacheTimestamp(childId);
      console.log('[Cache] Cached activity data');
      
      return data;
    } catch (error) {
      console.error('[ChildService]getActivity error occurred:', error);
      throw error;
    }
  },

  async getMilestone(childId: string): Promise<MilestoneData[]> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]getMilestone failed: user not authenticated');
      throw new Error('User must be logged in to get activity data');
    }
    try {
      console.log('[ChildService]getMilestone executing for childId:', childId);

      if (await isCacheValid(childId)) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.MILESTONE + childId);
        if (cachedData) {
          console.log('[Cache] Returning cached milestone data');
          const parsedData = JSON.parse(cachedData);
          return parsedData.map((milestone: any) => ({
            ...milestone,
            dateTime: new Date(milestone.dateTime)
          }));
        }
      }

      incrementQueryCounter('getMilestone', childId);
      const milestoneCollection = collection(db, 'children', childId, 'milestone');
      const snapshot = await getDocs(milestoneCollection);
      console.log(`...[getMilestone] milestone data returned with ${snapshot.docs.length} entries`);
      
      const data = snapshot.docs.map((d) => ({
        ...(d.data() as any),
        docId: d.id,
        dateTime: d.data().dateTime.toDate()
      })) as MilestoneData[];

      await AsyncStorage.setItem(CACHE_KEYS.MILESTONE + childId, JSON.stringify(data));
      await updateCacheTimestamp(childId);
      console.log('[Cache] Cached milestone data');
      
      return data;
    } catch (error) {
      console.error('[ChildService]getMilestone error occurred:', error);
      throw error;
    }
  },

  async getWeight(childId: string): Promise<WeightData[]> {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('[ChildService]getWeight failed: user not authenticated');
      throw new Error('User must be logged in to get weight data');
    }
    try {
      console.log('[ChildService]getWeight executing for childId:', childId);

      if (await isCacheValid(childId)) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEYS.WEIGHT + childId);
        if (cachedData) {
          console.log('[Cache] Returning cached weight data');
          const parsedData = JSON.parse(cachedData);
          return parsedData.map((weight: any) => ({
            ...weight,
            dateTime: new Date(weight.dateTime)
          }));
        }
      }

      incrementQueryCounter('getWeight', childId);
      const weightCollection = collection(db, 'children', childId, 'weight');
      const snapshot = await getDocs(weightCollection);
      console.log(`...[getWeight] weight data returned with ${snapshot.docs.length} entries`);
      
      const data = snapshot.docs.map((d) => ({
        ...(d.data() as any),
        docId: d.id,
        dateTime: d.data().dateTime.toDate()
      })) as WeightData[];

      await AsyncStorage.setItem(CACHE_KEYS.WEIGHT + childId, JSON.stringify(data));
      await updateCacheTimestamp(childId);
      console.log('[Cache] Cached weight data');
      
      return data;
    } catch (error) {
      console.error('[ChildService]getWeight error occurred:', error);
      throw error;
    }
  }
};

export const ChildUpdateService = {
  async updateSleep(childId: string, docId: string, partial: Partial<SleepData>): Promise<void> {
    const ref = doc(db, 'children', childId, 'sleep', docId);
    await updateDoc(ref, {
      ...(partial.start ? { start: partial.start } : {}),
      ...(partial.end ? { end: partial.end } : {}),
      ...(typeof partial.quality === 'number' ? { quality: partial.quality } : {}),
    });
    await clearChildCache(childId);
  },
  async deleteSleep(childId: string, docId: string): Promise<void> {
    const ref = doc(db, 'children', childId, 'sleep', docId);
    await deleteDoc(ref);
    await clearChildCache(childId);
  },

  async updateFeed(childId: string, docId: string, partial: Partial<FeedData>): Promise<void> {
    const ref = doc(db, 'children', childId, 'feed', docId);
    await updateDoc(ref, {
      ...(typeof partial.amount === 'number' ? { amount: partial.amount } : {}),
      ...(partial.dateTime ? { dateTime: partial.dateTime } : {}),
      ...(partial.description !== undefined ? { description: partial.description } : {}),
      ...(typeof partial.duration === 'number' ? { duration: partial.duration } : {}),
      ...(partial.notes !== undefined ? { notes: partial.notes } : {}),
      ...(partial.type ? { type: partial.type } : {}),
      ...(partial.side !== undefined ? { side: partial.side || null } : {}),
    } as any);
    await clearChildCache(childId);
  },
  async deleteFeed(childId: string, docId: string): Promise<void> {
    const ref = doc(db, 'children', childId, 'feed', docId);
    await deleteDoc(ref);
    await clearChildCache(childId);
  },

  async updateDiaper(childId: string, docId: string, partial: Partial<DiaperData>): Promise<void> {
    const ref = doc(db, 'children', childId, 'diaper', docId);
    await updateDoc(ref, {
      ...(partial.dateTime ? { dateTime: partial.dateTime } : {}),
      ...(partial.type ? { type: partial.type } : {}),
      ...(partial.hasRash !== undefined ? { hasRash: partial.hasRash } : {}),
      ...(partial.peeAmount !== undefined ? { peeAmount: partial.peeAmount || null } : {}),
      ...(partial.pooAmount !== undefined ? { pooAmount: partial.pooAmount || null } : {}),
      ...(partial.pooColor !== undefined ? { pooColor: partial.pooColor || null } : {}),
      ...(partial.pooConsistency !== undefined ? { pooConsistency: partial.pooConsistency || null } : {}),
    } as any);
    await clearChildCache(childId);
  },
  async deleteDiaper(childId: string, docId: string): Promise<void> {
    const ref = doc(db, 'children', childId, 'diaper', docId);
    await deleteDoc(ref);
    await clearChildCache(childId);
  },

  async updateActivity(childId: string, docId: string, partial: Partial<ActivityData>): Promise<void> {
    const ref = doc(db, 'children', childId, 'activity', docId);
    await updateDoc(ref, {
      ...(partial.dateTime ? { dateTime: partial.dateTime } : {}),
      ...(partial.type ? { type: partial.type } : {}),
    });
    await clearChildCache(childId);
  },
  async deleteActivity(childId: string, docId: string): Promise<void> {
    const ref = doc(db, 'children', childId, 'activity', docId);
    await deleteDoc(ref);
    await clearChildCache(childId);
  },

  async updateMilestone(childId: string, docId: string, partial: Partial<MilestoneData>): Promise<void> {
    const ref = doc(db, 'children', childId, 'milestone', docId);
    await updateDoc(ref, {
      ...(partial.dateTime ? { dateTime: partial.dateTime } : {}),
      ...(partial.type ? { type: partial.type } : {}),
    });
    await clearChildCache(childId);
  },
  async deleteMilestone(childId: string, docId: string): Promise<void> {
    const ref = doc(db, 'children', childId, 'milestone', docId);
    await deleteDoc(ref);
    await clearChildCache(childId);
  },

  async updateWeight(childId: string, docId: string, partial: Partial<WeightData>): Promise<void> {
    const ref = doc(db, 'children', childId, 'weight', docId);
    await updateDoc(ref, {
      ...(partial.dateTime ? { dateTime: partial.dateTime } : {}),
      ...(typeof partial.pounds === 'number' ? { pounds: partial.pounds } : {}),
      ...(typeof partial.ounces === 'number' ? { ounces: partial.ounces } : {}),
    });
    await clearChildCache(childId);
  },
  async deleteWeight(childId: string, docId: string): Promise<void> {
    const ref = doc(db, 'children', childId, 'weight', docId);
    await deleteDoc(ref);
    await clearChildCache(childId);
  },
};