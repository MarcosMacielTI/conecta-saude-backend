import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function BackButton({ onPress, style, iconSize = 24, iconColor, ...props }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.cardHover, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
      {...props}
    >
      <Ionicons name="chevron-back" size={iconSize} color={iconColor || colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
