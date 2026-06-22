import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ChatInput({ value, onChangeText, onSend, onAttach, onEmoji, disabled }) {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // WhatsApp-style input colors
  const inputBg = theme === 'Claro' ? '#f0f0f0' : '#2a2f32';
  const inputBorder = theme === 'Claro' ? '#e5e5e5' : '#3a4043';

  return (
    <View style={[styles.container, { backgroundColor: theme === 'Claro' ? '#ffffff' : '#0f1419', borderTopColor: colors.border }]}>
      <TouchableOpacity
        onPress={onAttach}
        style={[styles.action, { backgroundColor: theme === 'Claro' ? '#f0f0f0' : '#3a4043' }]}
      >
        <Ionicons name="attach" size={22} color={colors.primary} />
      </TouchableOpacity>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            color: colors.text,
            borderColor: isFocused ? colors.primary : inputBorder
          }
        ]}
        placeholder="Digite uma mensagem"
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline
        maxLength={500}
      />

      <View style={styles.rightButtons}>
        <TouchableOpacity
          onPress={onEmoji}
          style={[styles.action, { backgroundColor: theme === 'Claro' ? '#f0f0f0' : '#3a4043' }]}
        >
          <Ionicons name="happy" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSend}
          style={[
            styles.sendButton,
            { backgroundColor: disabled ? colors.border : colors.primary }
          ]}
          disabled={disabled}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  buttonSpacer: {
    width: 8,
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginHorizontal: 6,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallSpacer: {
    width: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
