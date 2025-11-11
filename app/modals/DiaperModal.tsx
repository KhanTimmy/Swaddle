import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import CustomModal from '@/components/CustomModal';
import CustomButton from '@/components/CustomButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { DiaperData } from '@/services/ChildService';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedDropdown from '@/components/ThemedDropdown';

interface DiaperModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (diaperData: DiaperData) => Promise<void>;
  childId: string | undefined;
  initialData?: DiaperData;
  onDelete?: (docId: string) => Promise<void>;
}

const DiaperModal = ({ 
  visible, 
  onClose, 
  onSave, 
  childId,
  initialData,
  onDelete,
}: DiaperModalProps) => {
  const { theme } = useTheme();
  
  const [dateTime, setDateTime] = useState(new Date());
  const [diaperType, setDiaperType] = useState('');
  const [peeAmount, setPeeAmount] = useState<'little' | 'medium' | 'big' | ''>('');
  const [pooAmount, setPooAmount] = useState<'little' | 'medium' | 'big' | ''>('');
  const [pooColor, setPooColor] = useState<'yellow' | 'brown' | 'black' | 'green' | 'red' | ''>('');
  const [pooConsistency, setPooConsistency] = useState<'solid' | 'loose' | 'runny' | 'mucousy' | 'hard' | 'pebbles' | 'diarrhea' | ''>('');
  const [hasRash, setHasRash] = useState(false);
  
  const isEditMode = !!initialData;

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const diaperTypeData = [
    { key: '1', value: 'pee' },
    { key: '2', value: 'poo' },
    { key: '3', value: 'mixed' },
    { key: '4', value: 'dry' },
  ];

  const amountData = [
    { key: '1', value: 'little' },
    { key: '2', value: 'medium' },
    { key: '3', value: 'big' },
  ];

  const colorData = [
    { key: '1', value: 'yellow' },
    { key: '2', value: 'brown' },
    { key: '3', value: 'black' },
    { key: '4', value: 'green' },
    { key: '5', value: 'red' },
  ];

  const consistencyData = [
    { key: '1', value: 'solid' },
    { key: '2', value: 'loose' },
    { key: '3', value: 'runny' },
    { key: '4', value: 'mucousy' },
    { key: '5', value: 'hard' },
    { key: '6', value: 'pebbles' },
    { key: '7', value: 'diarrhea' },
  ];

  const handleSave = async () => {
    if (!childId) {
      Alert.alert('Error', 'No child selected');
      return;
    }

    if (!diaperType) {
      Alert.alert('Error', 'Please select a diaper type');
      return;
    }

    if (diaperType === 'pee' && !peeAmount) {
      Alert.alert('Error', 'Please select pee amount');
      return;
    }

    if (diaperType === 'poo' && (!pooAmount || !pooColor || !pooConsistency)) {
      Alert.alert('Error', 'Please fill in all poo details');
      return;
    }

    if (diaperType === 'mixed' && (!peeAmount || !pooAmount || !pooColor || !pooConsistency)) {
      Alert.alert('Error', 'Please fill in all details for mixed diaper');
      return;
    }

    try {
      const diaperData: DiaperData = {
        id: childId,
        dateTime,
        type: diaperType as 'pee' | 'poo' | 'mixed' | 'dry',
        hasRash,
        ...(isEditMode && initialData?.docId ? { docId: initialData.docId } : {}),
      };

      if (diaperType === 'pee' || diaperType === 'mixed') {
        diaperData.peeAmount = peeAmount || undefined;
      }

      if (diaperType === 'poo' || diaperType === 'mixed') {
        diaperData.pooAmount = pooAmount || undefined;
        diaperData.pooColor = pooColor || undefined;
        diaperData.pooConsistency = pooConsistency || undefined;
      }

      await onSave(diaperData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving diaper data:', error);
      Alert.alert('Error', 'Failed to save diaper data');
    }
  };

  const resetForm = () => {
    if (initialData) {
      setDateTime(initialData.dateTime);
      setDiaperType(initialData.type);
      setPeeAmount(initialData.peeAmount || '');
      setPooAmount(initialData.pooAmount || '');
      setPooColor(initialData.pooColor || '');
      setPooConsistency(initialData.pooConsistency || '');
      setHasRash(initialData.hasRash);
    } else {
      setDateTime(new Date());
      setDiaperType('');
      setPeeAmount('');
      setPooAmount('');
      setPooColor('');
      setPooConsistency('');
      setHasRash(false);
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
      'Delete Diaper Entry',
      'Are you sure you want to delete this diaper entry?',
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
              console.error('Error deleting diaper data:', error);
              Alert.alert('Error', 'Could not delete diaper data');
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
      title={isEditMode ? "Edit Diaper Data" : "Input Diaper Data"}
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

        <View style={styles.typeSection}>
          <Text style={[styles.label, { color: theme.text }]}>Diaper Type:</Text>
          <ThemedDropdown
            data={diaperTypeData.map(item => ({ label: item.value, value: item.value }))}
            value={diaperType}
            onValueChange={(val: string | number) => {
              const stringVal = String(val);
              setDiaperType(stringVal);
              if (stringVal === 'dry') {
                setPeeAmount('');
                setPooAmount('');
                setPooColor('');
                setPooConsistency('');
              } else if (stringVal === 'pee') {
                setPooAmount('');
                setPooColor('');
                setPooConsistency('');
              } else if (stringVal === 'poo') {
                setPeeAmount('');
              }
            }}
            placeholder="Select diaper type"
          />
        </View>

        {(diaperType === 'pee' || diaperType === 'mixed') && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Pee Amount:</Text>
            <ThemedDropdown
              data={amountData.map(item => ({ label: item.value, value: item.value }))}
              value={peeAmount}
              onValueChange={(val: string | number) => setPeeAmount(String(val) as 'little' | 'medium' | 'big' | '')}
              placeholder="Select pee amount"
            />
          </View>
        )}

        {(diaperType === 'poo' || diaperType === 'mixed') && (
          <>
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Poo Amount:</Text>
              <ThemedDropdown
                data={amountData.map(item => ({ label: item.value, value: item.value }))}
                value={pooAmount}
                onValueChange={(val: string | number) => setPooAmount(String(val) as 'little' | 'medium' | 'big' | '')}
                placeholder="Select poo amount"
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Poo Color:</Text>
              <ThemedDropdown
                data={colorData.map(item => ({ label: item.value, value: item.value }))}
                value={pooColor}
                onValueChange={(val: string | number) => setPooColor(String(val) as 'yellow' | 'brown' | 'black' | 'green' | 'red' | '')}
                placeholder="Select poo color"
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Poo Consistency:</Text>
              <ThemedDropdown
                data={consistencyData.map(item => ({ label: item.value, value: item.value }))}
                value={pooConsistency}
                onValueChange={(val: string | number) => setPooConsistency(String(val) as 'solid' | 'loose' | 'runny' | 'mucousy' | 'hard' | 'pebbles' | 'diarrhea' | '')}
                placeholder="Select poo consistency"
              />
            </View>
          </>
        )}

        <View style={styles.rashSection}>
          <Text style={[styles.label, { color: theme.text }]}>Diaper Rash:</Text>
          <View style={styles.rashGroup}>
            <TouchableOpacity
              style={styles.rashOption}
              onPress={() => setHasRash(true)}
            >
              <View style={[
                styles.rashCircle, 
                { borderColor: theme.tint },
                hasRash && { borderColor: theme.tint }
              ]}>
                {hasRash && <View style={[styles.rashInner, { backgroundColor: theme.tint }]} />}
              </View>
              <Text style={[styles.rashText, { color: theme.text }]}>Yes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rashOption}
              onPress={() => setHasRash(false)}
            >
              <View style={[
                styles.rashCircle, 
                { borderColor: theme.tint },
                !hasRash && { borderColor: theme.tint }
              ]}>
                {!hasRash && <View style={[styles.rashInner, { backgroundColor: theme.tint }]} />}
              </View>
              <Text style={[styles.rashText, { color: theme.text }]}>No</Text>
            </TouchableOpacity>
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
  typeSection: {
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  rashSection: {
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
  rashGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  rashOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  rashCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rashInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  rashText: {
    fontSize: 16,
    fontWeight: '500',
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

export default DiaperModal;