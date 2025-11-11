import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { WeightData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';

interface WeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weightData: WeightData) => Promise<void>;
  childId: string | undefined;
  currentWeight?: WeightData | null;
  initialData?: WeightData;
  onDelete?: (docId: string) => Promise<void>;
}

const WeightModal = ({
  visible,
  onClose,
  onSave,
  childId,
  currentWeight,
  initialData,
  onDelete,
}: WeightModalProps) => {
  const { theme } = useTheme();
  
  const [pounds, setPounds] = useState('');
  const [ounces, setOunces] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  const isEditMode = !!initialData;

  // Initialize form with current weight when modal opens
  React.useEffect(() => {
    if (visible && initialData) {
      setPounds(initialData.pounds.toString());
      setOunces(initialData.ounces.toString());
      setDateTime(initialData.dateTime);
    } else if (visible && currentWeight) {
      setPounds(currentWeight.pounds.toString());
      setOunces(currentWeight.ounces.toString());
    } else if (visible) {
      setPounds('');
      setOunces('');
    }
  }, [visible, currentWeight, initialData]);

  const handleSave = async () => {
    // Use current weight as defaults if user didn't enter new values
    const poundsNum = parseInt(pounds) || (currentWeight?.pounds || 0);
    const ouncesNum = parseInt(ounces) || (currentWeight?.ounces || 0);

    if (poundsNum < 0 || ouncesNum < 0) {
      Alert.alert('Error', 'Weight values cannot be negative');
      return;
    }
    
    if (ouncesNum >= 16) {
      Alert.alert('Error', 'Ounces must be less than 16');
      return;
    }
    
    if (poundsNum === 0 && ouncesNum === 0) {
      Alert.alert('Error', 'Weight must be greater than 0');
      return;
    }
    
    if (!childId) {
      Alert.alert('Error', 'No child selected');
      return;
    }

    try {
      const weightData: WeightData = {
        id: childId,
        dateTime: dateTime,
        pounds: poundsNum,
        ounces: ouncesNum,
        ...(isEditMode && initialData?.docId ? { docId: initialData.docId } : {}),
      };
      
      await onSave(weightData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving weight data:', error);
      Alert.alert('Error', 'Could not save weight data');
    }
  };

  const resetForm = () => {
    if (initialData) {
      setPounds(initialData.pounds.toString());
      setOunces(initialData.ounces.toString());
      setDateTime(initialData.dateTime);
    } else if (currentWeight) {
      setPounds(currentWeight.pounds.toString());
      setOunces(currentWeight.ounces.toString());
    } else {
      setPounds('');
      setOunces('');
    }
    if (!initialData) {
      setDateTime(new Date());
    }
  };

  const handleDelete = async () => {
    if (!initialData?.docId || !onDelete) return;
    
    Alert.alert(
      'Delete Weight Entry',
      'Are you sure you want to delete this weight entry?',
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
              console.error('Error deleting weight data:', error);
              Alert.alert('Error', 'Could not delete weight data');
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
      title={isEditMode ? "Edit Weight Entry" : "Record Weight Change"}
      showCloseButton={false}
      maxHeight="85%"
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

        {currentWeight && (
          <View style={styles.currentWeightSection}>
            <Text style={[styles.label, { color: theme.text }]}>Current Weight:</Text>
            <View style={[styles.currentWeightDisplay, { 
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.placeholder
            }]}>
              <Text style={[styles.currentWeightText, { color: theme.secondaryText }]}>
                {currentWeight.pounds} lbs {currentWeight.ounces} oz
              </Text>
              <Text style={[styles.currentWeightDate, { color: theme.placeholder }]}>
                (Last recorded: {currentWeight.dateTime.toLocaleDateString()})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Weight:</Text>
          <View style={styles.weightInputContainer}>
            <View style={styles.weightInputWrapper}>
              <Text style={[styles.weightLabel, { color: theme.secondaryText }]}>Pounds</Text>
              <TextInput
                style={[styles.weightInput, { 
                  backgroundColor: theme.secondaryBackground,
                  borderColor: theme.placeholder,
                  color: theme.text
                }]}
                placeholder="0"
                placeholderTextColor={theme.placeholder}
                value={pounds}
                onChangeText={setPounds}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.weightInputWrapper}>
              <Text style={[styles.weightLabel, { color: theme.secondaryText }]}>Ounces</Text>
              <TextInput
                style={[styles.weightInput, { 
                  backgroundColor: theme.secondaryBackground,
                  borderColor: theme.placeholder,
                  color: theme.text
                }]}
                placeholder="0"
                placeholderTextColor={theme.placeholder}
                value={ounces}
                onChangeText={setOunces}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View> 
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
    fontWeight: 'bold',
    marginBottom: 5,
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
  weightInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  weightInputWrapper: {
    flex: 1,
  },
  weightLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  weightInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  weightNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  currentWeightSection: {
    marginBottom: 15,
  },
  currentWeightDisplay: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  currentWeightText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  currentWeightDate: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WeightModal;
