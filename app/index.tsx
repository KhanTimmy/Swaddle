import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView,
  Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from "react-native";
import { View as SafeAreaView } from 'react-native';
import React, { useState } from "react";
import { auth } from "@/firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { Image } from 'expo-image';
import CustomButton from "@/components/CustomButton";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedCloudBackground from '@/components/AnimatedCloudBackground';
import LoadingAnimation from '@/components/LoadingAnimation';

const index = () => {
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isInputValid = email.trim() !== '' && password.trim() !== '';

  const logIn = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Invalid email format.');
      return;
    }

    try {
      setLoading(true);
      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) router.replace('/(tabs)/home');
    } catch (error: any){
      console.log(error);
      setError("Sign in failed: " + error.message);
    } finally {
      setLoading(false);
    }
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
                <Text style={[styles.title, { color: theme.text }]}>Swaddle</Text>
                <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                  Your baby's first digital companion
                </Text>
                <Image
                  style={styles.logo}
                  source={require('../assets/images/logo.png')}
                  contentFit="contain"
                />
              </View>

              <View style={styles.formSection}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#DC3545" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.primary,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
                  <View
                    style={[
                      styles.passwordContainer,
                      { 
                        borderColor: theme.primary, 
                        backgroundColor: theme.cardBackground 
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.passwordInput, { color: theme.text }]}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.placeholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={secureText}
                      autoCapitalize="none"
                      textContentType="password"
                    />
                    <TouchableOpacity 
                      onPress={() => setSecureText(!secureText)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={secureText ? "eye-off" : "eye"} 
                        size={24} 
                        color={theme.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => router.push('/forgotpassword')}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={[styles.forgotPassword, { color: theme.text }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <LoadingAnimation text="Signing in..." size="large" />
                  </View>
                ) : (
                  <CustomButton
                    title="Sign In"
                    onPress={logIn}
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
                  title="Create Account"
                  onPress={() => router.push('/register')}
                  variant="primary"
                  style={{
                    ...styles.buttonBorder,
                    ...styles.registerButton,
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '400',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  formSection: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  errorText: {
    color: '#DC3545',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonBorder: {
    borderWidth: 2,
    borderRadius: 12,
  },
  registerButton: {
    marginTop: 12,
  },
});

export default index
