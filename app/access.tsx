import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert, Text, View, KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, SafeAreaView } from 'react-native';
import CustomButton from '@/components/CustomButton';
import { ChildService, ChildData } from '@/services/ChildService';
import { useSelectedChild } from '@/hooks/useSelectedChild';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { router } from 'expo-router';
import ChildSelectionModal from './modals/ChildSelectionModal';
import { getAuth } from 'firebase/auth';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedCloudBackground from '@/components/AnimatedCloudBackground';
import { Ionicons } from '@expo/vector-icons';

export default function AccessScreen() {
  const { selectedChild, saveSelectedChild, clearSelectedChild } = useSelectedChild();
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisibility, setModalVisibility] = useState<{ childSelection: boolean }>({
    childSelection: false
  });  
  const [childrenList, setChildrenList] = useState<ChildData[]>([]);

  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribeAuth = getAuth().onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/');
      } else {
        fetchUserChildrenList();
      }
    });
    return unsubscribeAuth;
  }, []);

  const fetchUserChildrenList = async () => {
    try {
      console.log('[access] fetchUserChildrenList called [ChildService]fetchUserChildren');
      const children = await ChildService.fetchUserChildren();
      setChildrenList(children);
    } catch (error) {
      console.error('Error fetching children list for access screen:', error);
    }
  };

  const handleNavigateToAddChild = () => {
    router.push('/addchild');
  };

  useEffect(() => {
    const fetchChildDetails = async () => {
      setLoading(true);
      try {
        if (selectedChild && selectedChild.id) {
          const childDocRef = doc(db, 'children', selectedChild.id);
          const childDocSnap = await getDoc(childDocRef);
          
          if (childDocSnap.exists()) {
            const childData = childDocSnap.data();
            setAuthorizedUsers(childData.authorized_uid || []);
            console.log('Authorized users:', childData.authorized_uid);
          } else {
            console.log('No such child document exists!');
            setAuthorizedUsers([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch child details:', error);
        setAuthorizedUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedChild) {
      fetchChildDetails();
    } else {
      setLoading(false);
    }
  }, [selectedChild]);

  const handleRemovalButtonPress = async () => {
    if (!selectedChild) {
      Alert.alert('No child selected', 'Please select a child to proceed.');
      return;
    }
  
    const actionType = selectedChild.type === 'Parent' ? 'delete' : 'remove';
    const actionText = selectedChild.type === 'Parent' ? 'Delete Child' : 'Remove Access';
    const confirmationMessage = selectedChild.type === 'Parent'
      ? `Are you sure you want to delete ${selectedChild.first_name} ${selectedChild.last_name}?`
      : `Are you sure you want to remove access for ${selectedChild.first_name} ${selectedChild.last_name}?`;

    Alert.alert(
      'Confirm Action',
      confirmationMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await ChildService.removeChildOrAccess(selectedChild);
              
              Alert.alert('Success', `Child has been ${actionType}d successfully.`);

              await clearSelectedChild();
            } catch (error) {
              console.error('Error performing action:', error);
              Alert.alert('Error', 'There was an issue performing the requested action.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}> 
      <AnimatedCloudBackground>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, width: '100%' }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.inner}>
              <View style={styles.headerSection}>
                <Text style={[styles.title, { color: theme.text }]}>Manage Access</Text>
                <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                  View caregivers for your child, remove access, or add a new caregiver
                </Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading...</Text>
                </View>
              ) : selectedChild ? (
                <View style={[styles.childInfoContainer, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
                  <View style={styles.childInfoHeader}>
                    <Ionicons name="person" size={24} color={theme.primary} />
                    <View style={styles.childInfoText}>
                      <Text style={[styles.childName, { color: theme.text }]}>
                        {selectedChild.first_name} {selectedChild.last_name}
                      </Text>
                      <Text style={[styles.childType, { color: theme.secondaryText }]}>
                        {selectedChild.type === 'Parent' ? 'You are the parent' : 'You are an authorized caregiver'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.noChildContainer, { backgroundColor: theme.cardBackground }]}>
                  <Ionicons name="information-circle" size={24} color={theme.secondaryText} />
                  <Text style={[styles.noChildText, { color: theme.text }]}>
                    No child selected. Please select a child first.
                  </Text>
                </View>
              )}

              {selectedChild && (
                <CustomButton
                  title={selectedChild.type === 'Parent' ? 'Delete Child' : 'Remove Access'}
                  onPress={handleRemovalButtonPress}
                  variant="danger"
                  style={styles.actionButton}
                />
              )}

              {selectedChild && selectedChild.type === 'Parent' && (
                <View style={styles.caregiversSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Authorized Caregivers</Text>
                  
                  {authorizedUsers.length > 0 ? (
                    <View style={styles.userListContainer}>
                      <FlatList
                        data={authorizedUsers}
                        keyExtractor={(item, index) => `user-${index}`}
                        renderItem={({ item }) => (
                          <View style={[styles.userItem, { backgroundColor: theme.background }]}>
                            <View style={styles.userInfo}>
                              <Ionicons name="mail" size={16} color={theme.secondaryText} />
                              <Text style={[styles.userText, { color: theme.text }]}>{item}</Text>
                            </View>
                            <TouchableOpacity 
                              style={[styles.removeButton, { backgroundColor: '#DC3545' }]}
                              onPress={async () => {
                                try {
                                  const childDocRef = doc(db, 'children', selectedChild.id);
                                  await updateDoc(childDocRef, {
                                    authorized_uid: arrayRemove(item)
                                  });
                                  setAuthorizedUsers(prev => prev.filter(uid => uid !== item));
                                  console.log('Removed user:', item);
                                } catch (error) {
                                  console.error('Error removing authorized user:', error);
                                }
                              }}
                            >
                              <Ionicons name="trash" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}
                        style={styles.userList}
                        scrollEnabled={false}
                      />
                    </View>
                  ) : (
                    <View style={[styles.emptyStateContainer, { backgroundColor: theme.background }]}>
                      <Ionicons name="people-outline" size={32} color={theme.secondaryText} />
                      <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
                        No authorized users for this child.
                      </Text>
                    </View>
                  )}
                  
                  <CustomButton 
                    title="Add New Caregiver" 
                    onPress={() => {
                      router.push('/addcaregiver');
                      console.log('Add new authorized user');
                    }}
                    style={{
                      ...styles.buttonBorder,
                      borderColor: theme.text
                    }}
                  />
                </View>
              )}
              
              <ChildSelectionModal
                visible={modalVisibility.childSelection}
                onClose={() => setModalVisibility(prev => ({ ...prev, childSelection: false }))}
                childrenList={childrenList}
                selectedChild={selectedChild}
                onSelectChild={saveSelectedChild}
                onClearSelection={clearSelectedChild}
              />

              <CustomButton
                title="Back"
                onPress={() => router.back()}
                variant="secondary"
                style={{
                  ...styles.buttonBorder,
                  borderColor: theme.text
                }}
              />
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </AnimatedCloudBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingTop: 60,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'left',
    paddingHorizontal: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  childInfoContainer: {
    width: '100%',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  childInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  childType: {
    fontSize: 14,
    fontWeight: '500',
  },
  noChildContainer: {
    width: '100%',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noChildText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  actionButton: {
    marginBottom: 20,
  },
  caregiversSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  userListContainer: {
    marginBottom: 20,
  },
  userList: {
    width: '100%',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonBorder: {
    borderWidth: 2,
    borderRadius: 12,
  },
});