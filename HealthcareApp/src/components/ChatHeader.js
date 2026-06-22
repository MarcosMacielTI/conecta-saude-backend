import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ChatHeader({ title, subtitle, onBack, onCall }) {
  const { colors, theme } = useTheme();
  // WhatsApp header color
  const headerBg = theme === 'Claro' ? '#ffffff' : '#111b20';

  return (
    <View style={[styles.container, { backgroundColor: headerBg, borderBottomColor: colors.border }]}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Pressable onPress={onCall} style={[styles.callButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="call" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
