import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from './src/hooks/useTheme';
import { AuthContext } from './src/context/AuthContext';
import BackButton from './src/components/BackButton';
import { subscriptionsAPI, professionalsAPI, paymentsAPI, authAPI } from './api';

export default function PlansScreen({ navigation }) {
  const colors = useThemeColors();
  const { user, updateUser } = useContext(AuthContext);
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [defaultProfessional, setDefaultProfessional] = useState(null);
  const [isProfessionalLoading, setIsProfessionalLoading] = useState(false);
  const [professionalError, setProfessionalError] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  useEffect(() => {
    const loadDefaultProfessional = async () => {
      if (user?.professionalId) return;
      setIsProfessionalLoading(true);
      setProfessionalError(null);

      try {
        const response = await professionalsAPI.getProfessional();
        if (response?.data) {
          setDefaultProfessional(response.data);
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar profissional padrão:', error);
      }

      try {
        const fallbackResponse = await professionalsAPI.getAll();
        if (fallbackResponse?.data?.length > 0) {
          setDefaultProfessional(fallbackResponse.data[0]);
          setProfessionalError(null);
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar profissional fallback:', error);
      }

      setProfessionalError('Não foi possível carregar um profissional no momento.');
    };

    loadDefaultProfessional().finally(() => setIsProfessionalLoading(false));
  }, [user]);

  // Preços para cada período
  const prices = {
    mensal: { basico: 89.00, intermediario: 149.00, premium: 249.00 },
    bimestral: { basico: 178.00, intermediario: 298.00, premium: 498.00 },
    trimestral: { basico: 267.00, intermediario: 447.00, premium: 747.00 },
    semestral: { basico: 534.00, intermediario: 894.00, premium: 1494.00 },
  };

  // Períodos disponíveis
  const periods = [
    { id: 'mensal', label: 'Mensal', divider: 1 },
    { id: 'bimestral', label: 'Bimestral', divider: 2 },
    { id: 'trimestral', label: 'Trimestral', divider: 3 },
    { id: 'semestral', label: 'Semestral', divider: 6 },
  ];

  // Definição dos planos
  const plans = [
    {
      id: 'teste',
      name: 'Teste Premium',
      description: 'Plano de teste quase grátis com todos os benefícios do Premium',
      consultations: '3 Consultas/mês',
      features: [
        '3 Consultas/mês',
        'Nutricionista + Educador Físico + Psicólogo',
        'Chat Liberado e Ilimitado',
        'Prioridade no Atendimento',
        'Custo de R$0,01 para teste',
      ],
      popular: true,
    },
    {
      id: 'basico',
      name: 'Básico',
      description: 'Ideal para começar sua jornada de saúde',
      consultations: '1 Consulta/mês',
      features: [
        '1 Consulta/mês',
        'Nutricionista ou Educador Físico',
        'Plano Personalizado',
      ],
      popular: false,
    },
    {
      id: 'intermediario',
      name: 'Intermediário',
      description: 'Para quem quer acompanhamento completo',
      consultations: '2 Consultas/mês',
      features: [
        '2 Consultas/mês',
        'Nutricionista + Educador Físico',
        'Plano Alimentar Personalizado',
        'Plano de Treino Personalizado',
        'Suporte por Chat',
      ],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Acompanhamento completo com prioridade',
      consultations: '3 Consultas/mês',
      features: [
        '3 Consultas/mês',
        'Nutricionista + Educador Físico + Psicólogo',
        'Plano Alimentar Personalizado',
        'Plano de Treino Personalizado',
        'Chat Liberado e Ilimitado',
        'Prioridade no Atendimento',
      ],
      popular: false,
    },
  ];

  const getConsultationsCount = (planId) => {
    if (planId === 'premium' || planId === 'teste') return 3;
    if (planId === 'intermediario') return 2;
    return 1;
  };

  const paymentMethods = [
    { id: 'pix', label: 'PIX' },
    { id: 'credit_card', label: 'Cartão de Crédito' },
    { id: 'debit_card', label: 'Cartão de Débito' },
    { id: 'boleto', label: 'Boleto' },
  ];

  const getConfirmMessage = (plan, price, periodLabel) => {
    const isTestPlan = plan.id === 'teste';
    const methodLabel = paymentMethods.find((method) => method.id === paymentMethod)?.label || 'PIX';
    const baseMessage = isTestPlan
      ? `Você quer testar o Plano Premium por R$0,01 usando ${methodLabel}?\n\nEle terá todos os benefícios do Premium e ficará vinculado ao seu profissional.`
      : `Você escolheu o plano ${plan.name} ${periodLabel.toLowerCase()} por R$ ${price.toFixed(2)} usando ${methodLabel}.\n\nAo confirmar, você receberá os direitos do plano contratado com o profissional vinculado.`;

    return baseMessage;
  };

  const handleSelectPlan = async (plan) => {
    console.log('📋 handleSelectPlan called with plan:', plan);
    try {
      if (isProfessionalLoading) {
        Alert.alert('Aguarde', 'Carregando profissional. Tente novamente em alguns segundos.');
        return;
      }
      if (!user) {
        console.warn('User not found');
        Alert.alert('Atenção', 'Faça login para contratar um plano.');
        return;
      }

      console.log('✅ User authenticated:', user.email);

      const isTestPlan = plan.id === 'teste';
      const planKey = isTestPlan ? 'premium' : plan.id;

      console.log('💰 Calculating price for:', { selectedPeriod, planKey, isTestPlan });
      console.log('Available prices:', prices);

      const price = isTestPlan ? 0.01 : (prices[selectedPeriod]?.[planKey] || prices['mensal'][planKey] || 0);
      const periodLabel = periods.find(p => p.id === selectedPeriod)?.label || 'Mensal';

      console.log('💵 Price calculated:', { price, periodLabel });

      let professionalId = user.professionalId || defaultProfessional?._id;
      console.log('🔍 Initial professionalId:', professionalId);

      if (!professionalId) {
        console.log('🔄 Fetching professional...');
        try {
          const response = await professionalsAPI.getProfessional();
          console.log('✅ Got professional response:', response?.data?.name);
          if (response?.data) {
            setDefaultProfessional(response.data);
            professionalId = response.data._id;
          }
        } catch (error) {
          console.error('❌ Erro ao carregar profissional padrão:', error.message);
        }
      }

      if (!professionalId) {
        console.log('🔄 Fetching all professionals as fallback...');
        try {
          const fallbackResponse = await professionalsAPI.getAll();
          console.log('✅ Got professionals:', fallbackResponse?.data?.length);
          if (fallbackResponse?.data?.length > 0) {
            setDefaultProfessional(fallbackResponse.data[0]);
            professionalId = fallbackResponse.data[0]._id;
            console.log('✅ Set professionalId from fallback:', professionalId);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar profissional fallback:', error.message);
        }
      }

      if (!professionalId) {
        console.error('❌ No professionalId found');
        Alert.alert('Atenção', 'Nenhum profissional disponível para associar o plano. Tente novamente mais tarde.');
        return;
      }

      const consultations = getConsultationsCount(plan.id);
      console.log('📝 Confirm plan object:', { plan: plan.name, price, periodLabel, consultations });

      setConfirmPlan({
        ...plan,
        price,
        periodLabel,
        professionalId,
        planKey,
        isTestPlan,
        consultations,
      });
      setPaymentMethod('pix');
      console.log('✅ Setting confirmVisible to true');
      setConfirmVisible(true);
    } catch (error) {
      console.error('❌ Erro geral no handleSelectPlan:', error);
      console.error('Stack:', error.stack);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    }
  };

  const confirmPurchase = async () => {
    if (!confirmPlan || !user) return;
    setConfirmVisible(false);
    setPaymentResult(null);
    setPaymentStatus(null);

    if (paymentMethod !== 'pix') {
      Alert.alert('Em breve', 'No momento, apenas PIX está disponível. Outros meios serão adicionados em breve.');
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const requestData = {
        planId: confirmPlan.id,
      };
      console.log('🚀 Enviando pedido PIX para criar pagamento:', requestData);

      const response = await paymentsAPI.createPix(requestData);
      console.log('✅ Recebido paymentResult:', response.data);

      setPaymentResult(response.data);
      setPaymentStatus(response.data.status || 'pending');
      setPaymentModalVisible(true);
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error?.response?.data || error?.message || error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível iniciar o pagamento PIX.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const checkPaymentStatus = async () => {
    const paymentId = paymentResult?.paymentId || paymentResult?.id;
    if (!paymentId) {
      Alert.alert('Erro', 'Nenhum pagamento para verificar.');
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const statusResponse = await paymentsAPI.getStatus(paymentId);
      const status = statusResponse.data?.status;
      setPaymentStatus(status);

      if (status === 'approved') {
        const profileResponse = await authAPI.me();
        if (profileResponse?.data) {
          await updateUser(profileResponse.data);
        }
        Alert.alert('Pagamento aprovado', 'Seu plano está ativo. Verifique sua aba de assinaturas ou agende uma consulta.');
        setPaymentModalVisible(false);
        setPaymentResult(null);
        setConfirmPlan(null);
        setPaymentStatus(null);
        return;
      }

      Alert.alert('Status do pagamento', `O pagamento está com status: ${status}.`);
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      Alert.alert('Erro', 'Não foi possível verificar o status do pagamento. Tente novamente em alguns minutos.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.innerScrollView} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View style={styles.headerLeft}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Planos Disponíveis</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.headerContent}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Escolha o período e o plano que melhor se adequa às suas necessidades
          </Text>
          {isProfessionalLoading && (
            <Text style={[styles.infoText, { color: colors.primary, marginTop: 8 }]}>Carregando profissional disponível...</Text>
          )}
          {!isProfessionalLoading && professionalError && (
            <Text style={[styles.infoText, { color: '#d9534f', marginTop: 8 }]}>Nenhum profissional disponível no momento.</Text>
          )}
          {!isProfessionalLoading && !professionalError && !user?.professionalId && defaultProfessional && (
            <Text style={[styles.infoText, { color: colors.text, marginTop: 8 }]}>Profissional disponível: {defaultProfessional.name}</Text>
          )}
        </View>

        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <Pressable
              key={period.id}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.id ? colors.primary : colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period.id ? '#ffffff' : colors.text,
                    fontWeight: selectedPeriod === period.id ? '700' : '500',
                  },
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Cards de Planos */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isTestPlan = plan.id === 'teste';
            const planKey = isTestPlan ? 'premium' : plan.id;
            const price = isTestPlan ? 0.01 : prices[selectedPeriod][planKey];
            const monthlyPrice = price / periods.find(p => p.id === selectedPeriod).divider;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: plan.popular ? colors.primary : colors.border,
                    borderWidth: plan.popular ? 2 : 1,
                  },
                ]}
              >
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="star" size={12} color="white" />
                    <Text style={styles.popularBadgeText}>Mais Popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
                </View>

                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceValue, { color: colors.primary }]}>R$ {price.toFixed(2)}</Text>
                    <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/{selectedPeriod}</Text>
                  </View>
                  <View style={[styles.monthlyPriceRow, { backgroundColor: colors.cardHover, borderColor: colors.border }]}>
                    <Text style={[styles.monthlyPriceLabel, { color: colors.textSecondary }]}>R$ {monthlyPrice.toFixed(2)}/mês</Text>
                  </View>
                </View>

                <View style={[styles.consultationsBadge, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.consultationsText, { color: colors.primary }]}>{plan.consultations}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.featuresSection}>
                  <Text style={[styles.featuresTitle, { color: colors.text }]}>O que está incluído:</Text>
                  <View style={styles.featuresList}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                        <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.selectButton,
                    {
                      backgroundColor: plan.popular ? colors.primary : colors.card,
                      borderColor: colors.primary,
                      borderWidth: plan.popular ? 0 : 1,
                      opacity: isProfessionalLoading || (!defaultProfessional && !user?.professionalId) ? 0.6 : 1,
                    },
                  ]}
                  disabled={isProfessionalLoading || (!defaultProfessional && !user?.professionalId)}
                  onPress={() => {
                    console.log('🔘 BUTTON CLICKED for plan:', plan.name);
                    handleSelectPlan(plan);
                  }}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      {
                        color: plan.popular ? '#ffffff' : colors.primary,
                      },
                    ]}
                  >
                    Contratar Plano
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={plan.popular ? '#ffffff' : colors.primary}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Card de Informações */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardHover, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Dúvidas?</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Você pode mudar de plano a qualquer momento. Sem contratos de longa duração ou cobranças ocultas.
          </Text>
        </View>
      </ScrollView>
      {console.log('📊 Modal state:', { confirmVisible, confirmPlan: confirmPlan?.name, paymentModalVisible })}
      {confirmVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirmar contrato</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {confirmPlan ? getConfirmMessage(confirmPlan, confirmPlan.price, confirmPlan.periodLabel) : 'Carregando...'}
            </Text>
            <View style={[styles.paymentMethodsContainer, { borderColor: colors.border }]}>
              <Text style={[styles.paymentMethodsTitle, { color: colors.text }]}>Forma de pagamento</Text>
              <View style={styles.paymentMethodsList}>
                {paymentMethods.map((method) => (
                  <Pressable
                    key={method.id}
                    style={[
                      styles.paymentMethodItem,
                      { backgroundColor: colors.card },
                      paymentMethod === method.id && { borderColor: colors.primary, backgroundColor: colors.cardHover },
                    ]}
                    onPress={() => setPaymentMethod(method.id)}
                  >
                    <Text style={[styles.paymentMethodText, { color: paymentMethod === method.id ? colors.primary : colors.text }]}>{method.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => { setConfirmVisible(false); setConfirmPlan(null); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Não</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: colors.primary, opacity: isPaymentProcessing ? 0.6 : 1 }]}
                disabled={isPaymentProcessing}
                onPress={confirmPurchase}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}> {isPaymentProcessing ? 'Aguarde...' : 'Sim'} </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      {paymentModalVisible && paymentResult && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Pagamento PIX gerado</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {paymentResult.message || 'Escaneie o QR Code abaixo para efetuar o pagamento. A ativação será concluída automaticamente após a confirmação.'}
            </Text>
            {paymentResult.qrCodeUrl ? (
              <Image source={{ uri: paymentResult.qrCodeUrl }} style={styles.qrCodeImage} />
            ) : (
              <ScrollView style={styles.qrCodeTextContainer}>
                <Text style={[styles.qrCodeText, { color: colors.text }]}>
                  {paymentResult.qrCodeData || paymentResult.pixCode || paymentResult.qrCode || JSON.stringify(paymentResult, null, 2)}
                </Text>
              </ScrollView>
            )}
            {paymentStatus ? (
              <Text style={[styles.paymentInfoText, { color: colors.textSecondary, marginBottom: 12 }]}>Status atual: {paymentStatus}</Text>
            ) : null}
            <Text style={[styles.paymentInfoText, { color: colors.textSecondary }]}>Pagamento expira em: {paymentResult.expiresAt ? new Date(paymentResult.expiresAt).toLocaleString() : '—'}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => { setPaymentModalVisible(false); setPaymentResult(null); setConfirmPlan(null); setPaymentStatus(null); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Fechar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalConfirm,
                  { backgroundColor: colors.primary, opacity: isPaymentProcessing ? 0.6 : 1 },
                ]}
                disabled={isPaymentProcessing}
                onPress={checkPaymentStatus}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}> {isPaymentProcessing ? 'Verificando...' : 'Verificar status'} </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  headerLeft: {
    position: 'absolute',
    left: 8,
  },
  headerRight: {
    position: 'absolute',
    right: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  planHeader: {
    marginBottom: 16,
    paddingRight: 80,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 14,
  },
  monthlyPriceRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  monthlyPriceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  consultationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  consultationsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  innerScrollView: {
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  paymentInfoText: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  qrCodeImage: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    marginVertical: 12,
    borderRadius: 16,
  },
  qrCodeTextContainer: {
    maxHeight: 220,
    padding: 14,
    backgroundColor: '#00000005',
    borderRadius: 12,
    marginVertical: 12,
  },
  qrCodeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  paymentMethodsContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentMethodsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  paymentMethodItem: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalConfirm: {},
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
