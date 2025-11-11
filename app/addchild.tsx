import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { useSelectedChild } from '@/hooks/useSelectedChild';
import { ChildService, NewChildData, ChildData } from '@/services/ChildService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedCloudBackground from '@/components/AnimatedCloudBackground';
import { Ionicons } from '@expo/vector-icons';

export default function AddChild() {
  const { theme } = useTheme();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [pounds, setPounds] = useState('');
  const [ounces, setOunces] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { saveSelectedChild } = useSelectedChild();

  const validateForm = () => {
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!dob) {
      setError('Date of Birth is required');
      return false;
    }
    if (!sex) {
      setError('Please select the sex');
      return false;
    }
    if (pounds.trim() !== '' || ounces.trim() !== '') {
      if (pounds.trim() === '' || ounces.trim() === '') {
        setError('If entering weight, enter both pounds and ounces');
        return false;
      }

      const poundsNum = parseInt(pounds, 10);
      const ouncesNum = parseInt(ounces, 10);

      if (isNaN(poundsNum) || isNaN(ouncesNum)) {
        setError('Pounds and ounces must be numbers');
        return false;
      }
      if (poundsNum <= 0 || ouncesNum <= 0) {
        setError('Pounds and ounces must be greater than 0');
        return false;
      }
      if (ouncesNum >= 16) {
        setError('Ounces must be between 1 and 15');
        return false;
      }
    }
    return true;
  };

  const saveChild = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const childData: NewChildData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        dob: dob,
        sex: sex,
      };

      // Add weight if both fields provided (validated above)
      if (pounds.trim() !== '' && ounces.trim() !== '') {
        const poundsNum = parseInt(pounds, 10);
        const ouncesNum = parseInt(ounces, 10);
        childData.weight = {
          pounds: poundsNum,
          ounces: ouncesNum
        };
      }

      const newChild = await ChildService.addChild(childData);

      await saveSelectedChild(newChild);
      
      Alert.alert('Success', 'Child added successfully!');
      router.back();
    } catch (error) {
      console.error('Error adding child:', error);
      setError('Error adding child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = firstName.trim() !== '' && lastName.trim() !== '' && dob !== '' && sex !== '';

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
                <Text style={[styles.title, { color: theme.text }]}>Add Child</Text>
                <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                  Enter your child's information to get started with tracking their development
                </Text>
              </View>

              <View style={styles.formSection}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#DC3545" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.primary,
                      color: theme.text
                    }]}
                    placeholder="Enter first name"
                    placeholderTextColor={theme.placeholder}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    textContentType="givenName"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.primary,
                      color: theme.text
                    }]}
                    placeholder="Enter last name"
                    placeholderTextColor={theme.placeholder}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoComplete="family-name"
                    textContentType="familyName"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.primary
                    }]}
                    onPress={() => setDatePickerVisibility(true)}
                  >
                    <View style={styles.dateButtonContent}>
                      <Ionicons name="calendar" size={20} color={theme.primary} />
                      <Text style={[styles.dateButtonText, { color: dob ? theme.text : theme.placeholder }]}>
                        {dob ? dob : "Select Date of Birth"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <View style={[styles.radioGroupContainer, { 
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.primary
                  }]}>
                    <View style={styles.radioGroup}>
                      <TouchableOpacity
                        style={styles.radioOption}
                        onPress={() => setSex('male')}
                      >
                        <View style={[
                          styles.radioCircle, 
                          { borderColor: theme.primary },
                          sex === 'male' && { borderColor: theme.primary }
                        ]}>
                          {sex === 'male' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                        </View>
                        <Text style={[styles.radioText, { color: theme.text }]}>Male</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.radioOption}
                        onPress={() => setSex('female')}
                      >
                        <View style={[
                          styles.radioCircle, 
                          { borderColor: theme.primary },
                          sex === 'female' && { borderColor: theme.primary }
                        ]}>
                          {sex === 'female' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                        </View>
                        <Text style={[styles.radioText, { color: theme.text }]}>Female</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.weightInputContainer}>
                    <View style={styles.weightInputWrapper}>
                      <TextInput
                        style={[styles.weightInput, { 
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.primary,
                          color: theme.text
                        }]}
                        placeholder="Enter Lbs."
                        placeholderTextColor={theme.placeholder}
                        value={pounds}
                        onChangeText={setPounds}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.weightInputWrapper}>
                      <TextInput
                        style={[styles.weightInput, { 
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.primary,
                          color: theme.text
                        }]}
                        placeholder="Enter Oz."
                        placeholderTextColor={theme.placeholder}
                        value={ounces}
                        onChangeText={setOunces}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
                      Adding child...
                    </Text>
                  </View>
                ) : (
                  <CustomButton 
                    title="Save Child" 
                    onPress={saveChild} 
                    variant={isFormValid ? "primary" : "secondary"}
                    style={{
                      ...styles.buttonBorder,
                      borderColor: theme.text,
                      ...(!isFormValid ? styles.disabledButton : {})
                    }}
                    disabled={!isFormValid}
                  />
                )}

                <CustomButton 
                  title="Cancel" 
                  onPress={() => router.back()} 
                  variant="secondary"
                  style={{
                    ...styles.buttonBorder,
                    ...styles.cancelButton,
                    borderColor: theme.text
                  }}
                />
              </View>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                  const formattedDate = new Date(date).toLocaleDateString('en-CA');
                  setDob(formattedDate);
                  setDatePickerVisibility(false);
                }}
                onCancel={() => setDatePickerVisibility(false)}
                maximumDate={new Date()}
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
  formSection: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  errorText: {
    color: '#DC3545',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  dateButton: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  radioGroupContainer: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 16,
    fontWeight: '500',
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonBorder: {
    borderWidth: 2,
    borderRadius: 12,
  },
  cancelButton: {
    marginTop: 20,
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
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  weightNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
