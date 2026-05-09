import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './src/context/AuthContext';
import { useTheme } from './src/context/ThemeContext';
import BackButton from './src/components/BackButton';

function normalizePlan(plan) {
    if (!plan) return null;
    const value = String(plan).trim().toLowerCase();
    if (value === 'sem plano' || value === 'semplano' || value === 'none' || value === 'no plan') return null;
    return value;
}

function getPlanLabel(plan) {
    const normalized = normalizePlan(plan);
    if (!normalized) return null;
    if (normalized.includes('prem')) return 'Premium';
    if (normalized.includes('inter')) return 'Intermediário';
    if (normalized.includes('bas')) return 'Básico';
    return plan;
}

export default function ActivePlanScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const { colors } = useTheme();

    const [showContinueModal, setShowContinueModal] = useState(false);
    const [showPlanDetails, setShowPlanDetails] = useState(false);
    const [continueNextMonth, setContinueNextMonth] = useState(false);

    const userPlan = getPlanLabel(user?.plan);
    const hasActivePlan = !!userPlan;
    const subscriptionDate = new Date(user?.subscriptionDate || Date.now());
    const endDate = new Date(subscriptionDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const planPrices = {
        'Básico': 89.00,
        'Intermediário': 149.00,
        'Premium': 249.00,
    };

    const planConsultations = {
        'Básico': '1 Consulta/mês',
        'Intermediário': '2 Consultas/mês',
        'Premium': '3 Consultas/mês',
    };

    const planFeatures = {
        'Básico': ['1 Consulta/mês (Nutri ou Ed. Físico)', 'Plano Alimentar ou Treino'],
        'Intermediário': ['2 Consultas/mês (Nutri e Ed. Físico)', 'Plano Alimentar e Treino', 'Suporte via Chat'],
        'Premium': ['3 Consultas/mês (Inclusos os 3)', 'Acompanhamento Psicológico', 'Chat Liberado Ilimitado', 'Prioridade no Atendimento'],
    };

    const handlePaid = (monthIndex) => {
        Alert.alert('Pagamento Confirmado', `Pagamento do mês ${monthIndex + 1} realizado com sucesso!`);
    };

    if (!hasActivePlan) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: 0 }}>
                <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <BackButton onPress={() => navigation.goBack()} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Plano</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.cardHover }]}>
                        <Ionicons name="document-outline" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Você não possui plano</Text>
                    <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                        Escolha um plano para começar a acessar os benefícios da plataforma Conecta Saúde.
                    </Text>
                    <Pressable
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Plans')}
                    >
                        <Text style={styles.primaryButtonText}>Ver os Planos Disponíveis</Text>
                    </Pressable>
                </View>
            </ScrollView>
        );
    }

    const paymentMonths = [subscriptionDate];
    if (continueNextMonth) {
        const nextMonth = new Date(subscriptionDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        paymentMonths.push(nextMonth);
    }

    const price = planPrices[userPlan] || 0;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Plano</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <View style={styles.planCardHeader}>
                    <View>
                        <Text style={[styles.planLabel, { color: colors.textTertiary }]}>Plano Ativo</Text>
                        <Text style={[styles.planTitle, { color: colors.text }]}>{userPlan}</Text>
                    </View>
                    <View style={[styles.activeBadge, { backgroundColor: `${colors.success}20` }]}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                </View>
                <View style={{ marginTop: 16, marginBottom: 16 }}>
                    <Text style={[styles.dateInfo, { color: colors.textSecondary }]}>
                        Assinado em: {subscriptionDate.toLocaleDateString('pt-BR')}
                    </Text>
                    <Text style={[styles.dateInfo, { color: colors.textSecondary }]}>
                        Válido até: {endDate.toLocaleDateString('pt-BR')}
                    </Text>
                </View>
            </View>

            <Pressable
                style={[styles.detailsButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowPlanDetails(true)}
            >
                <View style={styles.detailsButtonContent}>
                    <Text style={[styles.detailsButtonText, { color: colors.text }]}>Detalhes do Plano</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>
            </Pressable>

            <View style={styles.tableContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pagamentos</Text>
                <View style={[styles.table, { borderColor: colors.border }]}>
                    <View style={[styles.tableHeader, { backgroundColor: colors.cardHover, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Text style={[styles.tableHeaderCell, { color: colors.textTertiary }, styles.cell30]}>Vencimento</Text>
                        <Text style={[styles.tableHeaderCell, { color: colors.textTertiary }, styles.cell25]}>Valor</Text>
                        <Text style={[styles.tableHeaderCell, { color: colors.textTertiary }, styles.cell25]}>Status</Text>
                        <Text style={[styles.tableHeaderCell, { color: colors.textTertiary }, styles.cell20]}>Ação</Text>
                    </View>
                    {paymentMonths.map((month, index) => (
                        <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                            <Text style={[styles.tableCell, { color: colors.text }, styles.cell30]}>
                                {month.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                            </Text>
                            <Text style={[styles.tableCell, { color: colors.text }, styles.cell25]}>
                                R$ {price.toFixed(2)}
                            </Text>
                            <View style={styles.cell25}>
                                <View style={[styles.statusBadge, { backgroundColor: `${colors.warning}20` }]}>
                                    <Text style={[styles.statusText, { color: colors.warning }]}>PAGAR</Text>
                                </View>
                            </View>
                            <Pressable
                                style={[styles.payButton, { backgroundColor: colors.primary }, styles.cell20]}
                                onPress={() => handlePaid(index)}
                            >
                                <Ionicons name="checkmark" size={16} color="white" />
                            </Pressable>
                        </View>
                    ))}
                </View>
            </View>

            {!continueNextMonth && (
                <Pressable
                    style={[styles.continueButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowContinueModal(true)}
                >
                    <Text style={styles.continueButtonText}>Continuar no próximo mês?</Text>
                </Pressable>
            )}

            <Pressable
                style={[styles.changePlanButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => navigation.navigate('Plans')}
            >
                <Text style={[styles.changePlanButtonText, { color: colors.text }]}>Mudar de Plano</Text>
            </Pressable>

            <Modal visible={showContinueModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.containerBg }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Continuar no próximo mês?</Text>
                        <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                            Você deseja continuar com o plano {userPlan} no próximo mês?
                        </Text>
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => setShowContinueModal(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Não</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    setContinueNextMonth(true);
                                    setShowContinueModal(false);
                                }}
                            >
                                <Text style={styles.confirmButtonText}>Sim, Continuar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPlanDetails} transparent animationType="slide">
                <View style={[styles.detailsModalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.detailsHeader, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Pressable onPress={() => setShowPlanDetails(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                        <Text style={[styles.detailsTitle, { color: colors.text }]}>Detalhes do Plano {userPlan}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.detailsContent}>
                        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.detailsLabel, { color: colors.textTertiary }]}>Plano</Text>
                            <Text style={[styles.detailsPlanName, { color: colors.text }]}>{userPlan}</Text>
                        </View>

                        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.detailsLabel, { color: colors.textTertiary }]}>Consultas Incluídas</Text>
                            <Text style={[styles.detailsValue, { color: colors.text }]}>{planConsultations[userPlan]}</Text>
                        </View>

                        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.detailsLabel, { color: colors.textTertiary }]}>Benefícios</Text>
                            {planFeatures[userPlan].map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.detailsLabel, { color: colors.textTertiary }]}>Preço</Text>
                            <Text style={[styles.priceValue, { color: colors.primary }]}>R$ {price.toFixed(2)}/mês</Text>
                        </View>
                    </ScrollView>

                    <Pressable
                        style={[styles.closeDetailsButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowPlanDetails(false)}
                    >
                        <Text style={styles.closeDetailsButtonText}>Fechar</Text>
                    </Pressable>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    primaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    planCard: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 20,
        borderRadius: 12,
    },
    planCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    planLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    planTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    activeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    dateInfo: {
        fontSize: 13,
        marginBottom: 6,
    },
    detailsButton: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
    },
    detailsButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailsButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    tableContainer: {
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    table: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    tableHeaderCell: {
        fontSize: 12,
        fontWeight: '700',
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 13,
        fontWeight: '500',
    },
    cell30: {
        flex: 0,
        width: '30%',
    },
    cell25: {
        flex: 0,
        width: '25%',
    },
    cell20: {
        flex: 0,
        width: '20%',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    payButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButton: {
        marginHorizontal: 16,
        marginBottom: 12,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    changePlanButton: {
        marginHorizontal: 16,
        marginBottom: 32,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    changePlanButtonText: {
        fontWeight: '700',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 16,
        padding: 24,
        width: '85%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        fontWeight: '700',
    },
    cancelButton: {
        borderWidth: 1,
    },
    cancelButtonText: {
        fontWeight: '700',
        fontSize: 16,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    detailsModalContainer: {
        flex: 1,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    detailsContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    detailsCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    detailsLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    detailsPlanName: {
        fontSize: 20,
        fontWeight: '700',
    },
    detailsValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        flex: 1,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    closeDetailsButton: {
        marginHorizontal: 16,
        marginBottom: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeDetailsButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
});
