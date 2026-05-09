import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './src/context/ThemeContext';
import BackButton from './src/components/BackButton';

export default function ProfessionalRecordsScreen({ navigation }) {
  const { colors } = useTheme();
  const records = [
    { id: '1', title: 'João Silva', subtitle: 'Última consulta: 02/05/2026' },
    { id: '2', title: 'Maria Santos', subtitle: 'Última consulta: 28/04/2026' },
    { id: '3', title: 'Pedro Oliveira', subtitle: 'Última consulta: 25/04/2026' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: colors.text }]}>Prontuários</Text>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>Acesse os prontuários de pacientes e acompanhe o histórico de consultas.</Text>

      <View style={[styles.recordsList, { borderColor: colors.border }]}> 
        {records.map((record) => (
          <Pressable key={record.id} style={[styles.recordItem, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={[styles.recordIcon, { backgroundColor: colors.primary }]}> 
              <Ionicons name="person" size={20} color="white" />
            </View>
            <View style={styles.recordText}>
              <Text style={[styles.recordTitle, { color: colors.text }]}>{record.title}</Text>
              <Text style={[styles.recordSubtitle, { color: colors.textSecondary }]}>{record.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => {}}>
        <Text style={[styles.primaryButtonText, { color: '#ffffff' }]}>Novo prontuário</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  recordsList: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordText: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  recordSubtitle: {
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
