import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './src/context/AuthContext';
import { useThemeColors } from './src/hooks/useTheme';
import { availabilityAPI } from './api';

const dayLabels = {
  Monday: 'Segunda',
  Tuesday: 'Terça',
  Wednesday: 'Quarta',
  Thursday: 'Quinta',
  Friday: 'Sexta',
  Saturday: 'Sábado',
  Sunday: 'Domingo'
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityManagementScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const colors = useThemeColors();

  const [schedule, setSchedule] = useState({
    Monday: { active: true, startTime: '08:00', endTime: '17:00' },
    Tuesday: { active: true, startTime: '08:00', endTime: '17:00' },
    Wednesday: { active: true, startTime: '08:00', endTime: '17:00' },
    Thursday: { active: true, startTime: '08:00', endTime: '17:00' },
    Friday: { active: true, startTime: '08:00', endTime: '17:00' },
    Saturday: { active: false, startTime: '09:00', endTime: '12:00' },
    Sunday: { active: false, startTime: '00:00', endTime: '00:00' }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await availabilityAPI.getMyAvailability();
      if (response.data?.schedule) {
        setSchedule(response.data.schedule);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Erro', 'Falha ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day].active
      }
    }));
  };

  const updateTime = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      await availabilityAPI.updateMyAvailability(schedule);
      Alert.alert('Sucesso', 'Seus horários foram salvos com sucesso!');
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Erro', 'Falha ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Meus Horários</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Configure os dias e horários disponíveis para seus pacientes marcarem consultas
          </Text>
        </View>

        {/* Days */}
        {dayOrder.map((day) => (
          <View key={day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Pressable
              style={styles.dayToggle}
              onPress={() => toggleDay(day)}
            >
              <View style={[
                styles.checkbox,
                schedule[day].active && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                {schedule[day].active && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[styles.dayName, { color: colors.text, opacity: schedule[day].active ? 1 : 0.5 }]}>
                {dayLabels[day]}
              </Text>
            </Pressable>

            {schedule[day].active && (
              <View style={styles.timeInputRow}>
                <View style={[styles.timeInputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Início</Text>
                  <Text style={[styles.timeDisplay, { color: colors.primary }]}>{schedule[day].startTime}</Text>
                </View>

                <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />

                <View style={[styles.timeInputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Fim</Text>
                  <Text style={[styles.timeDisplay, { color: colors.primary }]}>{schedule[day].endTime}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.containerBg, borderTopColor: colors.border, borderTopWidth: 1 }]}>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={saveAvailability}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Salvar Horários</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
