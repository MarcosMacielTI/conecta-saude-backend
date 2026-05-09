import React, { useState, useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from './src/context/AuthContext';
import { useTheme } from './src/context/ThemeContext';
import BackButton from './src/components/BackButton';

const durations = [
  { id: 'monthly', label: 'Mensal' },
  { id: 'bimonthly', label: 'Bimestral' },
  { id: 'quarterly', label: 'Trimestral' },
  { id: 'semiannual', label: 'Semestral' },
];

const plans = {
  test: {
    title: 'Teste',
    description: 'R$ 0,01 com upgrade direto para Premium.',
    consultations: 1,
  },
  basic: {
    title: 'Básico',
    description: '1 consulta por mês com nutricionista ou educador físico + plano personalizado.',
    consultations: 1,
  },
  intermediate: {
    title: 'Intermediário',
    description: '2 consultas mensais com nutricionista e educador físico + plano alimentar, treino e suporte por chat.',
    consultations: 2,
  },
  premium: {
    title: 'Premium',
    description: '3 consultas por mês com nutricionista, educador físico e psicólogo + chat liberado e prioridade no atendimento.',
    consultations: 3,
  },
};

const prices = {
  monthly: { test: 0.01, basic: 29.90, intermediate: 49.90, premium: 79.90 },
  bimonthly: { test: 0.01, basic: 55.90, intermediate: 95.90, premium: 149.90 },
  quarterly: { test: 0.01, basic: 79.90, intermediate: 139.90, premium: 219.90 },
  semiannual: { test: 0.01, basic: 149.90, intermediate: 259.90, premium: 399.90 },
};

export default function SubscriptionScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user, updateUser } = useContext(AuthContext);
  const updateProfData = route.params?.updateProfData;
  const selectedPlanFromRoute = route.params?.selectedPlan ?? 'test';
  const selectedCycleFromRoute = route.params?.ciclo ?? 'monthly';
  const [selectedDuration, setSelectedDuration] = useState(
    ['monthly', 'bimonthly', 'quarterly', 'semiannual'].includes(selectedCycleFromRoute)
      ? selectedCycleFromRoute
      : 'monthly'
  );
  const [selectedPlan, setSelectedPlan] = useState(
    ['test', 'basic', 'intermediate', 'premium'].includes(selectedPlanFromRoute)
      ? selectedPlanFromRoute
      : 'test'
  );

  const applySubscription = async (planKey, price) => {
    const plan = plans[planKey];
    const durationLabel = durations.find((d) => d.id === selectedDuration).label;
    const patientName = user?.name || 'Paciente';

    if (updateProfData) {
      updateProfData((prev) =>
        prev.map((prof, index) =>
          index === 0
            ? {
              ...prof,
              clients: [...prof.clients, { name: patientName, plan: plan.title, duration: durationLabel }],
              balance: prof.balance + price,
            }
            : prof
        )
      );
    }

    if (updateUser && user) {
      await updateUser({ ...user, plan: plan.title, consultationsLeft: plan.consultations });
    }

    Alert.alert('Assinatura confirmada', `Você assinou o plano ${plan.title} por R$ ${price.toFixed(2)}.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleSubscribe = () => {
    if (selectedPlan === 'test') {
      Alert.alert(
        'Plano de teste',
        'Deseja pagar R$ 0,01 para ativar o plano Premium?',
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim', onPress: () => applySubscription('premium', 0.01) },
        ]
      );
      return;
    }

    const price = prices[selectedDuration][selectedPlan];
    applySubscription(selectedPlan, price);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Escolha seu Plano - Conecta Saúde</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Duração</Text>
        <View style={styles.options}>
          {durations.map((duration) => (
            <TouchableOpacity
              key={duration.id}
              style={[
                styles.option,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedDuration === duration.id && { borderColor: colors.primary, backgroundColor: colors.cardHover },
              ]}
              onPress={() => setSelectedDuration(duration.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: colors.text },
                  selectedDuration === duration.id && { color: colors.primary, fontWeight: 'bold' },
                ]}
              >
                {duration.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Plano</Text>
        {Object.entries(plans).map(([key, plan]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.planCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedPlan === key && { borderColor: colors.primary, backgroundColor: colors.cardHover },
            ]}
            onPress={() => setSelectedPlan(key)}
          >
            <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
            <Text style={[styles.planPrice, { color: colors.primary }]}>R$ {prices[selectedDuration][key].toFixed(2)} / {durations.find(d => d.id === selectedDuration).label.toLowerCase()}</Text>
            <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: colors.primary }]} onPress={handleSubscribe}>
        <Text style={[styles.subscribeText, { color: '#ffffff' }]}>Assinar Agora</Text>
      </TouchableOpacity>

      <BackButton style={styles.subscriptionBackButton} onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1f2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  planCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionBackButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: '#6b7280',
    fontSize: 14,
  },
});