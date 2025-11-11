import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, StyleSheet, View, Alert, KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import AnimatedCloudBackground from '@/components/AnimatedCloudBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddCaregiver() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { theme } = useTheme();

  const handleAddCaregiver = async () => {
    setError('');
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const savedChild = await AsyncStorage.getItem('selectedChild');
      if (!savedChild) {
        setError('No selected child found.');
        setLoading(false);
        return;
      }

      const childData = JSON.parse(savedChild);

      if (!childData.id) {
        setError('Selected child has no ID.');
        setLoading(false);
        return;
      }

      const childDocRef = doc(db, 'children', childData.id);
      await updateDoc(childDocRef, {
        authorized_uid: arrayUnion(email.toLowerCase()),
      });

      Alert.alert('Success', 'Caregiver added successfully.');
      router.back();
    } catch (error) {
      console.error('Error adding caregiver:', error);
      setError('Failed to add caregiver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isInputValid = email.trim() !== '';

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
                  <Text style={[styles.title, { color: theme.text }]}>Add Caregiver</Text>
                  <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                    Grant access to another caregiver to view and update your child's information
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
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Caregiver's Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.primary,
                          color: theme.text,
                        }
                      ]}
                      placeholder="Enter caregiver's email address"
                      placeholderTextColor={theme.placeholder}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                    />
                  </View>

                  <View style={[styles.infoContainer, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
                    <Ionicons name="information-circle" size={20} color={theme.primary} />
                    <Text style={[styles.infoText, { color: theme.text }]}>
                      The caregiver will receive access to view and update your child's information. They will need to create an account with the same email address.
                    </Text>
                  </View>

                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={theme.primary} />
                      <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
                        Adding caregiver...
                      </Text>
                    </View>
                  ) : (
                    <CustomButton
                      title="Add Caregiver"
                      onPress={handleAddCaregiver}
                      variant={isInputValid ? "primary" : "secondary"}
                      style={{
                        ...styles.buttonBorder,
                        borderColor: theme.text,
                        ...(!isInputValid ? styles.disabledButton : {})
                      }}
                      disabled={!isInputValid}
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
  iconContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(92, 184, 228, 0.1)',
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    lineHeight: 20,
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
});
