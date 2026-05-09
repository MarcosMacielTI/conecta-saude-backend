import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTheme } from './src/context/ThemeContext';
import { AuthContext } from './src/context/AuthContext';

export default function CalendarScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState('');

  const hasPlan = user?.plan && user.plan !== 'sem plano';
  const consultationsLeft = user?.consultationsLeft ?? 0;

  const handleDateSelect = (day) => {
    if (!hasPlan) {
      Alert.alert('Plano Necessário', 'Você precisa de um plano ativo para agendar consultas.');
      return;
    }

    if (consultationsLeft <= 0) {
      Alert.alert('Consultas Esgotadas', 'Você não tem consultas restantes no seu plano.');
      return;
    }

    setSelectedDate(day.dateString);
    // Aqui você pode navegar para uma tela de agendamento ou mostrar horários disponíveis
    Alert.alert('Data Selecionada', `Você selecionou ${day.dateString}. Agora escolha um profissional na aba "Buscar".`);
  };

  const markedDates = {
    [selectedDate]: { selected: true, selectedColor: colors.primary }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Agenda</Text>
        <View style={styles.headerRight} />
      </View>
      {/* Plano Info */}
      <View style={[styles.planInfo, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.planTitle, { color: colors.text }]}>
          Plano: {user?.plan || 'Sem Plano'}
        </Text>
        <Text style={[styles.planDetails, { color: colors.textSecondary }]}>
          Consultas restantes: {consultationsLeft}
        </Text>
      </View>

      {/* Calendário */}
      <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Selecione uma data</Text>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#fff',
            todayBackgroundColor: colors.primary,
            todayTextColor: '#fff',
            dayTextColor: colors.textSecondary,
            textDisabledColor: colors.textTertiary,
            dotColor: colors.primary,
            selectedDotColor: '#fff',
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            indicatorColor: colors.primary,
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      {/* Ações da Agenda */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ações da Agenda</Text>

        <Pressable
          style={[styles.actionButton, { backgroundColor: hasPlan ? colors.primary : colors.cardHover }]}
          onPress={() => {
            if (!hasPlan) {
              Alert.alert('Plano Necessário', 'Você precisa de um plano ativo para agendar consultas.');
              return;
            }
            navigation.navigate('Search');
          }}
        >
          <Text style={[styles.actionButtonText, { color: hasPlan ? '#fff' : colors.textSecondary }]}>
            Agendar Consulta
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ConversationsHistory')}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>
            Ver Histórico
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('Plans')}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>
            Ver Planos
          </Text>
        </Pressable>
      </View>

      {/* Instruções */}
      <View style={[styles.infoBox, { backgroundColor: colors.cardHover, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Como usar a Agenda</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          1. Selecione uma data no calendário{'\n'}
          2. Vá para "Buscar" para encontrar profissionais{'\n'}
          3. Conecte-se com o profissional desejado{'\n'}
          4. Agende sua consulta de vídeo
        </Text>
      </View>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    borderBottomWidth: 1,
  },
  headerLeft: {
    position: 'absolute',
    left: 8,
  },
  headerRight: {
    position: 'absolute',
    right: 8,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  planInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDetails: {
    fontSize: 14,
  },
  calendarContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});