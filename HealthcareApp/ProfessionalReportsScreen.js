import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './src/context/ThemeContext';
import BackButton from './src/components/BackButton';

export default function ProfessionalReportsScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: colors.text }]}>Relatórios</Text>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Desempenho</Text>
        <Text style={[styles.statValue, { color: colors.text }]}>R$ 8.750</Text>
        <Text style={[styles.statDescription, { color: colors.textSecondary }]}>Faturamento do mês</Text>
      </View>

      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.statItem}>
          <Text style={[styles.statItemLabel, { color: colors.textTertiary }]}>Consultas</Text>
          <Text style={[styles.statItemValue, { color: colors.text }]}>34</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statItemLabel, { color: colors.textTertiary }]}>Pacientes</Text>
          <Text style={[styles.statItemValue, { color: colors.text }]}>18</Text>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Últimos relatórios</Text>
        <View style={[styles.listItem, { backgroundColor: colors.cardHover }]}> 
          <Text style={[styles.listTitle, { color: colors.text }]}>Relatório semanal</Text>
          <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>Performance de consultas</Text>
        </View>
        <View style={[styles.listItem, { backgroundColor: colors.cardHover }]}> 
          <Text style={[styles.listTitle, { color: colors.text }]}>Análise de pacientes</Text>
          <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>Taxa de retenção</Text>
        </View>
      </View>

      <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => {}}>
        <Text style={[styles.primaryButtonText, { color: '#ffffff' }]}>Gerar novo relatório</Text>
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
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  statsCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  statDescription: {
    fontSize: 14,
  },
  statsRow: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    paddingRight: 10,
  },
  statItemLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statItemValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  listItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  listSubtitle: {
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
