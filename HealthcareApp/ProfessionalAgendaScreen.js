import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from './src/hooks/useTheme';
import BackButton from './src/components/BackButton';

// Tela de Horários (modal ou tela separada)
function HorariosModal({ visible, onClose, colors }) {
    const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const [horarios, setHorarios] = useState({
        Segunda: { ativo: true, inicio: '08:00', fim: '17:00' },
        Terça: { ativo: true, inicio: '08:00', fim: '17:00' },
        Quarta: { ativo: true, inicio: '08:00', fim: '17:00' },
        Quinta: { ativo: true, inicio: '08:00', fim: '17:00' },
        Sexta: { ativo: true, inicio: '08:00', fim: '17:00' },
        Sábado: { ativo: false, inicio: '09:00', fim: '12:00' },
    });

    const toggle = (day) => {
        setHorarios((prev) => ({
            ...prev,
            [day]: { ...prev[day], ativo: !prev[day].ativo },
        }));
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Meus Horários</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Configure os dias e horários disponíveis para consultas
                    </Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {weekDays.map((day) => (
                            <View key={day} style={[styles.dayRow, { borderColor: colors.border, borderBottomWidth: 1 }]}>
                                <Pressable style={styles.dayToggle} onPress={() => toggle(day)}>
                                    <View style={[
                                        styles.toggleIndicator,
                                        { backgroundColor: horarios[day].ativo ? colors.primary : colors.cardHover },
                                    ]}>
                                        {horarios[day].ativo && <Ionicons name="checkmark" size={12} color="#fff" />}
                                    </View>
                                    <Text style={[styles.dayName, { color: colors.text, opacity: horarios[day].ativo ? 1 : 0.4 }]}>
                                        {day}
                                    </Text>
                                </Pressable>
                                {horarios[day].ativo && (
                                    <View style={styles.timeInputRow}>
                                        <View style={[styles.timeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Início</Text>
                                            <Text style={[styles.timeValue, { color: colors.primary }]}>{horarios[day].inicio}</Text>
                                        </View>
                                        <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                                        <View style={[styles.timeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Fim</Text>
                                            <Text style={[styles.timeValue, { color: colors.primary }]}>{horarios[day].fim}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                    <Pressable
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={() => { Alert.alert('Horários salvos!', 'Seus horários foram atualizados.'); onClose(); }}
                    >
                        <Text style={styles.saveBtnText}>Salvar Horários</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

// Tela de Prontuário (modal)
function ProntuarioModal({ visible, onClose, colors, patient }) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Prontuário</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>
                    {patient ? (
                        <>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                Paciente: {patient.patient || patient.name}
                            </Text>
                            <View style={[styles.prontuarioSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Text style={[styles.prontuarioLabel, { color: colors.textSecondary }]}>Diagnóstico</Text>
                                <Text style={[styles.prontuarioValue, { color: colors.text }]}>—</Text>
                            </View>
                            <View style={[styles.prontuarioSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Text style={[styles.prontuarioLabel, { color: colors.textSecondary }]}>Observações</Text>
                                <Text style={[styles.prontuarioValue, { color: colors.text }]}>—</Text>
                            </View>
                            <View style={[styles.prontuarioSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                <Text style={[styles.prontuarioLabel, { color: colors.textSecondary }]}>Última consulta</Text>
                                <Text style={[styles.prontuarioValue, { color: colors.text }]}>—</Text>
                            </View>
                        </>
                    ) : (
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Selecione uma consulta para ver o prontuário.
                        </Text>
                    )}
                    <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
                        <Text style={styles.saveBtnText}>Fechar</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

// Tela de Notificação (modal)
function NotificacaoModal({ visible, onClose, colors, patient }) {
    const [msg, setMsg] = useState('');
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Notificar Paciente</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        {patient ? `Enviar notificação para: ${patient.patient || patient.name}` : 'Selecione uma consulta primeiro.'}
                    </Text>
                    {patient && (
                        <>
                            <TextInput
                                style={[styles.notifInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                placeholder="Digite a mensagem..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={4}
                                value={msg}
                                onChangeText={setMsg}
                            />
                            <Pressable
                                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    Alert.alert('Notificação enviada!', `Mensagem enviada para ${patient.patient || patient.name}.`);
                                    setMsg('');
                                    onClose();
                                }}
                            >
                                <Text style={styles.saveBtnText}>Enviar Notificação</Text>
                            </Pressable>
                        </>
                    )}
                    {!patient && (
                        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
                            <Text style={styles.saveBtnText}>Fechar</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </Modal>
    );
}

function ProfessionalAgendaScreen({ navigation }) {
    const colors = useThemeColors();

    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
    const [selectedDay, setSelectedDay] = useState(today.getDate());

    const [showHorarios, setShowHorarios] = useState(false);
    const [showProntuario, setShowProntuario] = useState(false);
    const [showNotificacao, setShowNotificacao] = useState(false);

    // Mock de consultas por dia (chave: "YYYY-MM-DD")
    const appointments = {
        [`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-10`]: [
            { id: 1, patient: 'João Silva', time: '09:00', type: 'Consulta', status: 'Confirmado' },
            { id: 2, patient: 'Maria Santos', time: '10:30', type: 'Follow-up', status: 'Confirmado' },
        ],
        [`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-15`]: [
            { id: 3, patient: 'Pedro Oliveira', time: '14:00', type: 'Avaliação', status: 'Pendente' },
        ],
        [`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-20`]: [
            { id: 4, patient: 'Ana Costa', time: '11:00', type: 'Consulta', status: 'Confirmado' },
            { id: 5, patient: 'Carlos Mendes', time: '15:30', type: 'Consulta', status: 'Confirmado' },
        ],
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const getPreviousMonth = (year, month) => {
        if (month === 0) {
            return { year: year - 1, month: 11 };
        }
        return { year, month: month - 1 };
    };

    const getNextMonth = (year, month) => {
        if (month === 11) {
            return { year: year + 1, month: 0 };
        }
        return { year, month: month + 1 };
    };

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prev = getPreviousMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(prev.year, prev.month);
    const calendarDays = [];

    // dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i -= 1) {
        calendarDays.push({
            day: prevMonthDays - i,
            monthOffset: -1,
        });
    }

    // dias do mês atual
    for (let i = 1; i <= daysInMonth; i += 1) {
        calendarDays.push({
            day: i,
            monthOffset: 0,
        });
    }

    // completar com dias do próximo mês até preencher 42 células
    const next = getNextMonth(currentYear, currentMonth);
    const nextDaysCount = 42 - calendarDays.length;
    for (let i = 1; i <= nextDaysCount; i += 1) {
        calendarDays.push({
            day: i,
            monthOffset: 1,
        });
    }

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const getDefaultSelectedDay = (year, month) => {
        if (year === today.getFullYear() && month === today.getMonth()) {
            return today.getDate();
        }
        return null;
    };

    const goToPrevMonth = () => {
        let nextYear = currentYear;
        let nextMonth = currentMonth - 1;

        if (nextMonth < 0) {
            nextMonth = 11;
            nextYear -= 1;
        }

        setCurrentYear(nextYear);
        setCurrentMonth(nextMonth);
        setSelectedDay(getDefaultSelectedDay(nextYear, nextMonth));
    };

    const goToNextMonth = () => {
        let nextYear = currentYear;
        let nextMonth = currentMonth + 1;

        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear += 1;
        }

        setCurrentYear(nextYear);
        setCurrentMonth(nextMonth);
        setSelectedDay(getDefaultSelectedDay(nextYear, nextMonth));
    };

    const selectedKey = selectedDay
        ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;
    const dayAppointments = selectedKey ? appointments[selectedKey] || [] : [];
    const selectedAppointment = dayAppointments[0] || null; // Para ações modais

    const hasAppointment = (day) => {
        if (!day) return false;
        const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return !!appointments[key];
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <View style={styles.headerLeft}>
                        <BackButton onPress={() => navigation.goBack()} />
                    </View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Agenda</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Calendário */}
                    <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        {/* Navegação de mês */}
                        <View style={styles.monthHeader}>
                            <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
                                <Ionicons name="chevron-back" size={24} color={colors.primary} />
                            </Pressable>
                            <Text style={[styles.monthTitle, { color: colors.text }]}>
                                {monthNames[currentMonth]} {currentYear}
                            </Text>
                            <Pressable onPress={goToNextMonth} style={styles.navBtn}>
                                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                            </Pressable>
                        </View>

                        {/* Dias da semana */}
                        <View style={styles.weekDays}>
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, idx) => (
                                <Text key={idx} style={[styles.weekDay, { color: colors.textSecondary }]}>{d}</Text>
                            ))}
                        </View>

                        {/* Grid de dias */}
                        <View style={styles.calendarGrid}>
                            {calendarDays.map((dayObj, idx) => {
                                const isCurrentMonth = dayObj.monthOffset === 0;
                                const isSelected = isCurrentMonth && dayObj.day === selectedDay;
                                const isToday = isCurrentMonth && dayObj.day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                                const hasApt = isCurrentMonth && hasAppointment(dayObj.day);
                                return (
                                    <Pressable
                                        key={idx}
                                        onPress={() => {
                                            if (!isCurrentMonth) {
                                                const targetMonth = currentMonth + dayObj.monthOffset;
                                                const targetDate = new Date(currentYear, targetMonth, dayObj.day);
                                                setCurrentYear(targetDate.getFullYear());
                                                setCurrentMonth(targetDate.getMonth());
                                                setSelectedDay(dayObj.day);
                                                return;
                                            }
                                            setSelectedDay(dayObj.day);
                                        }}
                                        style={[
                                            styles.dayButton,
                                            isSelected && [styles.selectedDay, { backgroundColor: colors.primary }],
                                            isToday && [styles.selectedDay, { backgroundColor: colors.primary }],
                                            !isCurrentMonth && styles.otherMonthDay,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            isSelected || isToday ? { color: '#fff', fontWeight: '700' } : isCurrentMonth ? { color: colors.text } : { color: colors.textSecondary },
                                        ]}>
                                            {dayObj.day}
                                        </Text>
                                        {hasApt && (
                                            <View style={[styles.aptDot, { backgroundColor: isSelected || isToday ? '#fff' : colors.primary }]} />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Consultas do dia */}
                    <View style={styles.appointmentsSection}>
                        <View style={styles.appointmentsHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Consultas — {selectedDay ? String(selectedDay).padStart(2, '0') : '--'} de {monthNames[currentMonth]}
                            </Text>
                            <View style={[styles.countBadge, { backgroundColor: `${colors.primary}20` }]}>
                                <Text style={[styles.countText, { color: colors.primary }]}>{dayAppointments.length}</Text>
                            </View>
                        </View>

                        {dayAppointments.length > 0 ? (
                            dayAppointments.map((apt) => (
                                <Pressable
                                    key={apt.id}
                                    onPress={() => navigation.navigate('Video', { patient: apt })}
                                    style={[styles.appointmentCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                                >
                                    <View style={[styles.timeBox, { backgroundColor: `${colors.primary}15` }]}>
                                        <Text style={[styles.aptTime, { color: colors.primary }]}>{apt.time}</Text>
                                    </View>
                                    <View style={styles.aptInfo}>
                                        <Text style={[styles.aptPatient, { color: colors.text }]}>{apt.patient}</Text>
                                        <Text style={[styles.aptType, { color: colors.textSecondary }]}>{apt.type}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, {
                                        backgroundColor: apt.status === 'Confirmado' ? `${colors.success}20` : `${colors.warning}20`,
                                    }]}>
                                        <Text style={[styles.statusText, {
                                            color: apt.status === 'Confirmado' ? colors.success : colors.warning,
                                        }]}>
                                            {apt.status}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))
                        ) : (
                            <View style={[styles.emptyState, { backgroundColor: colors.cardHover }]}>
                                <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma consulta neste dia</Text>
                            </View>
                        )}
                    </View>

                    {/* Ações */}
                    <View style={styles.actionsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ações</Text>
                        <View style={styles.actionGrid}>
                            <Pressable
                                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => {
                                    if (dayAppointments.length === 0) {
                                        Alert.alert('Sem consultas', 'Não há consultas agendadas neste dia.');
                                        return;
                                    }
                                    navigation.navigate('Video', { patient: selectedAppointment });
                                }}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name="videocam" size={22} color={colors.primary} />
                                </View>
                                <Text style={[styles.actionText, { color: colors.text }]}>Iniciar Consulta</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => setShowProntuario(true)}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: `${colors.secondary}15` }]}>
                                    <Ionicons name="document-text" size={22} color={colors.secondary} />
                                </View>
                                <Text style={[styles.actionText, { color: colors.text }]}>Prontuário</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => setShowNotificacao(true)}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: `${colors.warning}15` }]}>
                                    <Ionicons name="notifications" size={22} color={colors.warning} />
                                </View>
                                <Text style={[styles.actionText, { color: colors.text }]}>Notificar</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                                onPress={() => setShowHorarios(true)}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: `${colors.success}15` }]}>
                                    <Ionicons name="time" size={22} color={colors.success} />
                                </View>
                                <Text style={[styles.actionText, { color: colors.text }]}>Horários</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>

                {/* Modais */}
                <HorariosModal visible={showHorarios} onClose={() => setShowHorarios(false)} colors={colors} />
                <ProntuarioModal visible={showProntuario} onClose={() => setShowProntuario(false)} colors={colors} patient={selectedAppointment} />
                <NotificacaoModal visible={showNotificacao} onClose={() => setShowNotificacao(false)} colors={colors} patient={selectedAppointment} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
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
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

    // Calendário
    calendarCard: { borderRadius: 16, padding: 12, marginBottom: 20, borderWidth: 1 },
    monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    navBtn: { padding: 4 },
    monthTitle: { fontSize: 16, fontWeight: '700' },
    weekDays: { flexDirection: 'row', marginBottom: 6 },
    weekDay: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '600', height: 28 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayButton: {
        width: '14.28%',
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        marginBottom: 2,
        backgroundColor: 'transparent',
    },
    emptyDay: {},
    selectedDay: {
        borderRadius: 6,
    },
    todayDay: {
        borderRadius: 6,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '500',
    },
    aptDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginTop: 2,
    },
    otherMonthDay: {
        opacity: 0.4,
    },

    // Consultas
    appointmentsSection: { marginBottom: 20 },
    appointmentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    countText: { fontSize: 13, fontWeight: '700' },
    appointmentCard: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        borderRadius: 12, marginBottom: 8, gap: 12,
    },
    timeBox: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, minWidth: 56, alignItems: 'center' },
    aptTime: { fontSize: 13, fontWeight: '700' },
    aptInfo: { flex: 1 },
    aptPatient: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    aptType: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '600' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, borderRadius: 12, gap: 8 },
    emptyText: { fontSize: 13 },

    // Ações
    actionsSection: { marginBottom: 24 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionCard: {
        width: '47%', paddingVertical: 16, borderRadius: 14,
        alignItems: 'center', gap: 8, borderWidth: 1,
    },
    actionIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

    // Modais
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, maxHeight: '85%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalSubtitle: { fontSize: 14, marginBottom: 20 },
    saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Horários modal
    dayRow: { paddingVertical: 14 },
    dayToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    toggleIndicator: {
        width: 22, height: 22, borderRadius: 11,
        justifyContent: 'center', alignItems: 'center',
    },
    dayName: { fontSize: 15, fontWeight: '600' },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 34 },
    timeBox: {
        flex: 1, padding: 10, borderRadius: 8,
        borderWidth: 1, alignItems: 'center',
    },
    timeLabel: { fontSize: 10, marginBottom: 2 },
    timeValue: { fontSize: 15, fontWeight: '700' },

    // Prontuário
    prontuarioSection: { padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1 },
    prontuarioLabel: { fontSize: 11, marginBottom: 4, fontWeight: '600' },
    prontuarioValue: { fontSize: 15 },

    // Notificação
    notifInput: {
        borderWidth: 1, borderRadius: 12, padding: 14,
        minHeight: 100, textAlignVertical: 'top', fontSize: 14, marginBottom: 4,
    },
});

export default ProfessionalAgendaScreen;