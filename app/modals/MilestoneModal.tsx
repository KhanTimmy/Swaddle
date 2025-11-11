import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MilestoneData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedDropdown from '@/components/ThemedDropdown';

interface MilestoneModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (milestoneData: MilestoneData) => Promise<void>;
  childId: string | undefined; 
}

const MilestoneModal = ({
  visible,
  onClose,
  onSave,
  childId,
}: MilestoneModalProps) => {
  const { theme } = useTheme();
  
  const [dateTime, setDateTime] = useState(new Date());
  const [type, setType] = useState('');
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const data = [
    {key:'1', value:'smiling'},
    {key:'2', value:'rolling over'},
    {key:'3', value:'sitting up'},
    {key:'4', value:'crawling'},
    {key:'5', value:'walking'},
  ];

  const handleSave = async () => {
    if (!childId) {
      Alert.alert('Error', 'No child selected');
      return;
    }

    if (!type) {
      Alert.alert('Error', 'Please select milestone type');
      return;
    }

    try {
      const milestoneData: MilestoneData = {
        id: childId,
        dateTime: dateTime,
        type: type as 'smiling' | 'rolling over' | 'sitting up' | 'crawling' | 'walking',
      };
      
      await onSave(milestoneData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving milestone data:', error);
      Alert.alert('Error', 'Could not save milestone data');
    }
  };

  const resetForm = () => {
    setDateTime(new Date());
    setType('');
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Input Milestone Data"
      showCloseButton={false}
      maxHeight="70%"
    >
      <View style={styles.container}>
        <View>
          <Text style={[styles.label, { color: theme.text }]}>Date & Time:</Text>
          <Text 
            style={[styles.timeDisplay, { 
              color: theme.secondaryText,
              borderColor: theme.placeholder
            }]}
            onPress={() => setDatePickerVisibility(true)}
          >
            {dateTime.toLocaleString()}
          </Text>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          date={new Date()}
          onConfirm={(date) => {
            setDateTime(date);
            setDatePickerVisibility(false);
          }}
          onCancel={() => setDatePickerVisibility(false)}
          maximumDate={new Date()}
        />

        <View style={styles.typeSection}>
          <Text style={[styles.label, { color: theme.text }]}>Milestone Type:</Text>
          <ThemedDropdown
            data={data.map(item => ({ label: item.value, value: item.value }))}
            value={type}
            onValueChange={(val: string | number) => setType(String(val))}
            placeholder="Select milestone type"
          />
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Save"
            onPress={handleSave}
            variant="success"
            style={styles.button}
          />
        </View>
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 15,
  },
  typeSection: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  timeDisplay: {
    fontSize: 16,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonContainer: {
    marginTop: 15,
  },
  button: {
    width: '100%',
  },
});

export default MilestoneModal;