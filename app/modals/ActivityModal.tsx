import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ActivityData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedDropdown from '@/components/ThemedDropdown';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (activityData: ActivityData) => Promise<void>;
  childId: string | undefined;
  initialData?: ActivityData;
  onDelete?: (docId: string) => Promise<void>;
}

const ActivityModal = ({
  visible,
  onClose,
  onSave,
  childId,
  initialData,
  onDelete,
}: ActivityModalProps) => {
  const { theme } = useTheme();
  
  const [dateTime, setDateTime] = useState(new Date());
  const [type, setType] = useState('');
  
  const isEditMode = !!initialData;
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const activityTypeData = [
    {key:'1', value:'bath'},
    {key:'2', value:'tummy time'},
    {key:'3', value:'story time'},
    {key:'4', value:'skin to skin'},
    {key:'5', value:'brush teeth'},
  ];

  const handleSave = async () => {
    if (!childId) {
      Alert.alert('Error', 'No child selected');
      return;
    }

    if (!type) {
      Alert.alert('Error', 'Please select activity type');
      return;
    }

    try {
      const activityData: ActivityData = {
        id: childId,
        dateTime: dateTime,
        type: type as 'bath' | 'tummy time' | 'story time' | 'skin to skin' | 'brush teeth',
        ...(isEditMode && initialData?.docId ? { docId: initialData.docId } : {}),
      };
      
      await onSave(activityData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving activity data:', error);
      Alert.alert('Error', 'Could not save activity data');
    }
  };

  const resetForm = () => {
    if (initialData) {
      setDateTime(initialData.dateTime);
      setType(initialData.type);
    } else {
      setDateTime(new Date());
      setType('');
    }
  };

  // Initialize form when modal opens
  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, initialData]);

  const handleDelete = async () => {
    if (!initialData?.docId || !onDelete) return;
    
    Alert.alert(
      'Delete Activity Entry',
      'Are you sure you want to delete this activity entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(initialData.docId!);
              onClose();
            } catch (error) {
              console.error('Error deleting activity data:', error);
              Alert.alert('Error', 'Could not delete activity data');
            }
          },
        },
      ]
    );
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={isEditMode ? "Edit Activity Data" : "Input Activity Data"}
      showCloseButton={false}
      maxHeight="80%"
    >
      <View style={styles.container}>
        <View>
          <Text style={[styles.label, { color: theme.text }]}>Date and Time:</Text>
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

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Activity Type:</Text>
          <ThemedDropdown
            data={activityTypeData.map(item => ({ label: item.value, value: item.value }))}
            value={type}
            onValueChange={(val: string | number) => setType(String(val))}
            placeholder="Select activity type"
          />
        </View>



        <View style={styles.buttonContainer}>
          {isEditMode && onDelete && (
            <CustomButton
              title="Delete"
              onPress={handleDelete}
              variant="danger"
              style={styles.button}
            />
          )}
          <CustomButton
            title={isEditMode ? "Update" : "Save"}
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
  inputSection: {
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  button: {
    flex: 1,
  },
});

export default ActivityModal;