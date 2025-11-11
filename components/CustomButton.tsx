import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  fullWidth = true, 
  style = {},
  disabled = false 
}: ButtonProps) {
  const { theme } = useTheme();

  const backgroundColors: Record<string, string> = {
    primary: theme.tint,
    secondary: '#6C757D',
    danger: '#DC3545',
    success: '#28A745',
  };

  const textColors: Record<string, string> = {
    primary: '#F9FAFB', // Fixed color (dark mode text color) - doesn't change with theme
    secondary: '#fff',
    danger: '#fff',
    success: '#fff',
  };

  const buttonBackground = disabled ? '#E9ECEF' : backgroundColors[variant];
  const buttonText = disabled ? '#6C757D' : textColors[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: buttonBackground },
        fullWidth && styles.fullWidth,
        style,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        { color: buttonText },
        disabled && styles.disabledButtonText,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {},
});
