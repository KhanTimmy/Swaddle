import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { FeedData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedDropdown from '@/components/ThemedDropdown';

interface FeedModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (feedData: FeedData) => Promise<void>;
  childId: string | undefined;
  initialData?: FeedData;
  onDelete?: (docId: string) => Promise<void>;
}

const FeedModal = ({
  visible,
  onClose,
  onSave,
  childId,
  initialData,
  onDelete,
}: FeedModalProps) => {
  const { theme } = useTheme();
  
  const [amount, setAmount] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [feedType, setFeedType] = useState('');
  const [side, setSide] = useState<'left' | 'right' | ''>('');
  
  const isEditMode = !!initialData;
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const feedTypeData = [
    {key:'1', value:'nursing'},
    {key:'2', value:'bottle'},
    {key:'3', value:'solid'},
  ];

  const sideData = [
    {key:'1', value:'left'},
    {key:'2', value:'right'},
  ];

  const handleSave = async () => {
    const amountNumber = parseFloat(amount);

    if ((feedType === 'bottle' || feedType === 'solid') && (isNaN(amountNumber) || amountNumber <= 0)) {
    Alert.alert('Error', 'Please enter a valid amount');
    return;
    }
    
    if (!childId) {
      Alert.alert('Error', 'No child selected');
      return;
    }

    if (!feedType) {
      Alert.alert('Error', 'Please select feed type');
      return;
    }

    if (feedType === 'nursing' && !side) {
      Alert.alert('Error', 'Please select nursing side');
      return;
    }

    const durationNumber = parseInt(duration);
    if (isNaN(durationNumber) || durationNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    try {
      const feedData: FeedData = {
        id: childId,
        amount: (feedType === 'bottle' || feedType === 'solid') ? amountNumber : 0,
        dateTime: dateTime,
        description: description,
        duration: durationNumber,
        notes: notes,
        type: feedType as 'nursing' | 'bottle' | 'solid',
        ...(isEditMode && initialData?.docId ? { docId: initialData.docId } : {}),
      };

      if (feedType === 'nursing') {
        feedData.side = side || undefined;
      }
      
      await onSave(feedData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving feed data:', error);
      Alert.alert('Error', 'Could not save feed data');
    }
  };

  const resetForm = () => {
    if (initialData) {
      setDateTime(initialData.dateTime);
      setDescription(initialData.description);
      setDuration(initialData.duration.toString());
      setNotes(initialData.notes);
      setFeedType(initialData.type);
      setSide(initialData.side || '');
      setAmount(initialData.amount.toString());
    } else {
      setDateTime(new Date());
      setDescription('');
      setDuration('');
      setNotes('');
      setFeedType('');
      setSide('');
      setAmount('');
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
      'Delete Feed Entry',
      'Are you sure you want to delete this feed entry?',
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
              console.error('Error deleting feed data:', error);
              Alert.alert('Error', 'Could not delete feed data');
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
      title={isEditMode ? "Edit Feeding Data" : "Input Feeding Data"}
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

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Feed Type:</Text>
          <ThemedDropdown
            data={feedTypeData.map(item => ({ label: item.value, value: item.value }))}
            value={feedType}
            onValueChange={(val: string | number) => {
              const stringVal = String(val);
              setFeedType(stringVal);
              if (stringVal !== 'nursing') {
                setSide('');
              }
            }}
            placeholder='Select feed type'
          />
        </View>

        {feedType === 'nursing' && (
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.text }]}>Side:</Text>
            <ThemedDropdown
              data={sideData.map(item => ({ label: item.value, value: item.value }))}
              value={side}
              onValueChange={(val: string | number) => setSide(String(val) as 'left' | 'right' | '')}
              placeholder='Select side'
            />
          </View>
        )}

        {(feedType === 'bottle' || feedType === 'solid') && (
        <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.text }]}>Amount (oz or g):</Text>
            <TextInput
            style={[styles.input, { 
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.placeholder,
              color: theme.text
            }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor={theme.placeholder}
            keyboardType="numeric"
            />
        </View>
        )}

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Duration (minutes):</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.placeholder,
              color: theme.text
            }]}
            value={duration}
            onChangeText={setDuration}
            placeholder="Enter duration in minutes"
            placeholderTextColor={theme.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Description:</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.placeholder,
              color: theme.text
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Notes:</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { 
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.placeholder,
              color: theme.text
            }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter additional notes"
            placeholderTextColor={theme.placeholder}
            multiline={true}
            numberOfLines={3}
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
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default FeedModal;