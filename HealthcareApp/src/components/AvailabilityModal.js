import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { availabilityAPI } from '../../api.js';
import { useTheme } from '../context/ThemeContext.js';

const dayLabels = {
  Monday: 'Segunda',
  Tuesday: 'Terça',
  Wednesday: 'Quarta',
  Thursday: 'Quinta',
  Friday: 'Sexta',
  Saturday: 'Sábado',
  Sunday: 'Domingo'
};

export default function AvailabilityModal({ visible, onClose, professionalId, colors }) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && professionalId) {
      loadAvailability();
    }
  }, [visible, professionalId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await availabilityAPI.getProfessionalAvailability(professionalId);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Horários Disponíveis</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : availability ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
              {Object.entries(availability.schedule).map(([day, info]) => (
                <View key={day} style={[styles.dayCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayName, { color: colors.text }]}>
                      {dayLabels[day]}
                    </Text>
                    {info.active ? (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      </View>
                    ) : (
                      <Text style={[styles.closedText, { color: colors.textSecondary }]}>Fechado</Text>
                    )}
                  </View>

                  {info.active && (
                    <View style={styles.timeRow}>
                      <View style={styles.timeItem}>
                        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Início</Text>
                        <Text style={[styles.timeValue, { color: colors.primary }]}>{info.startTime}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                      <View style={styles.timeItem}>
                        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Fim</Text>
                        <Text style={[styles.timeValue, { color: colors.primary }]}>{info.endTime}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.centerContent}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                Sem informações de horários disponíveis
              </Text>
            </View>
          )}

          {/* Footer */}
          <Pressable
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.confirmBtnText}>Entendi</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dayCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  closedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  confirmBtn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
