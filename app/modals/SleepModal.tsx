import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SleepData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';

interface SleepModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (sleepData: SleepData) => Promise<void>;
  childId: string | undefined;
  initialData?: SleepData;
  onDelete?: (docId: string) => Promise<void>;
}

const SleepModal = ({
  visible,
  onClose,
  onSave,
  childId,
  initialData,
  onDelete,
}: SleepModalProps) => {
  const { theme } = useTheme();
  
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date());
  const [quality, setQuality] = useState<number>(0);
  
  const isEditMode = !!initialData;
  
  const [isStartPickerVisible, setStartPickerVisibility] = useState(false);
  const [isEndPickerVisible, setEndPickerVisibility] = useState(false);

  const qualityLabels = [
    'Poor',
    'Fair', 
    'Good',
    'Very Good',
    'Excellent'
  ];

  const handleSave = async () => {
    if (!childId) {
      Alert.alert('Error', 'No child selected');
      return;
    }

    if (quality === 0) {
      Alert.alert('Error', 'Please select sleep quality');
      return;
    }

    if (startDateTime >= endDateTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      const sleepData: SleepData = {
        id: childId,
        start: startDateTime,
        end: endDateTime,
        quality: quality,
        ...(isEditMode && initialData?.docId ? { docId: initialData.docId } : {}),
      };
      
      await onSave(sleepData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving sleep data:', error);
      Alert.alert('Error', 'Could not save sleep data');
    }
  };

  const handleDelete = async () => {
    if (!initialData?.docId || !onDelete) return;
    
    Alert.alert(
      'Delete Sleep Entry',
      'Are you sure you want to delete this sleep entry?',
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
              console.error('Error deleting sleep data:', error);
              Alert.alert('Error', 'Could not delete sleep data');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    if (initialData) {
      setStartDateTime(initialData.start);
      setEndDateTime(initialData.end);
      setQuality(initialData.quality);
    } else {
      setStartDateTime(new Date());
      setEndDateTime(new Date());
      setQuality(0);
    }
  };

  // Initialize form when modal opens
  React.useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, initialData]);

  return (
    <CustomModal
      visible={visible}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={isEditMode ? "Edit Sleep Data" : "Input Sleep Data"}
      showCloseButton={false}
      maxHeight="75%"
    >
      <View style={styles.container}>
        <View>
          <Text style={[styles.label, { color: theme.text }]}>Start Time:</Text>
          <Text 
            style={[styles.timeDisplay, { 
              color: theme.secondaryText,
              borderColor: theme.placeholder
            }]}
            onPress={() => setStartPickerVisibility(true)}
          >
            {startDateTime.toLocaleString()}
          </Text>
        </View>

        <DateTimePickerModal
          isVisible={isStartPickerVisible}
          mode="datetime"
          date={new Date()}
          onConfirm={(date) => {
            setStartDateTime(date);
            setStartPickerVisibility(false);
          }}
          onCancel={() => setStartPickerVisibility(false)}
          maximumDate={new Date()}
        />

        <View>
          <Text style={[styles.label, { color: theme.text }]}>End Time:</Text>
          <Text 
            style={[styles.timeDisplay, { 
              color: theme.secondaryText,
              borderColor: theme.placeholder
            }]}
            onPress={() => setEndPickerVisibility(true)}
          >
            {endDateTime.toLocaleString()}
          </Text>
        </View>

        <DateTimePickerModal
          isVisible={isEndPickerVisible}
          mode="datetime"
          date={new Date()}
          onConfirm={(date) => {
            setEndDateTime(date);
            setEndPickerVisibility(false);
          }}
          onCancel={() => setEndPickerVisibility(false)}
          maximumDate={new Date()}
        />

        <View>
          <Text style={[styles.label, { color: theme.text }]}>Sleep Quality:</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setQuality(star)}
                style={styles.starButton}
              >
                <Text style={[
                  styles.star,
                  { color: star <= quality ? theme.tint : theme.placeholder }
                ]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {quality > 0 && (
            <Text style={[styles.qualityLabel, { color: theme.secondaryText }]}>
              {qualityLabels[quality - 1]}
            </Text>
          )}
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
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  star: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  qualityLabel: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SleepModal;