import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './src/context/ThemeContext';
import { AuthContext } from './src/context/AuthContext';

export default function CalendarScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useContext(AuthContext);

  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const hasPlan = user?.plan && user.plan !== 'sem plano';
  const consultationsLeft = user?.consultationsLeft ?? 0;

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year, month) =>
    new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleDateSelect = (dateString) => {
    if (!hasPlan) {
      Alert.alert(
        'Plano Necessário',
        'Você precisa de um plano ativo para agendar consultas.'
      );
      return;
    }

    if (consultationsLeft <= 0) {
      Alert.alert(
        'Consultas Esgotadas',
        'Você não tem consultas restantes no seu plano.'
      );
      return;
    }

    Alert.alert(
      'Data Selecionada',
      `Você selecionou ${dateString}. Agora escolha um profissional na aba "Buscar".`
    );
  };

  const selectCalendarDay = (day) => {
    if (!day) return;

    const dateString = `${currentYear}-${String(
      currentMonth + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    setSelectedDay(day);
    handleDateSelect(dateString);
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.containerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Agenda
        </Text>

        <View style={styles.headerRight} />
      </View>

      {/* Plano */}
      <View
        style={[
          styles.planInfo,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.planTitle,
            { color: colors.text },
          ]}
        >
          Plano: {user?.plan || 'Sem Plano'}
        </Text>

        <Text
          style={[
            styles.planDetails,
            { color: colors.textSecondary },
          ]}
        >
          Consultas restantes: {consultationsLeft}
        </Text>
      </View>

      {/* Calendário */}
      <View
        style={[
          styles.calendarContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          Selecione uma data
        </Text>

        <View style={styles.monthHeader}>
          <Pressable
            onPress={goToPrevMonth}
            style={styles.navBtn}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary}
            />
          </Pressable>

          <Text
            style={[
              styles.monthTitle,
              { color: colors.text },
            ]}
          >
            {monthNames[currentMonth]} {currentYear}
          </Text>

          <Pressable
            onPress={goToNextMonth}
            style={styles.navBtn}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.weekDays}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
            (day) => (
              <Text
                key={day}
                style={[
                  styles.weekDay,
                  { color: colors.textSecondary },
                ]}
              >
                {day}
              </Text>
            )
          )}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const isSelected = day === selectedDay;

            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            return (
              <Pressable
                key={index}
                onPress={() => selectCalendarDay(day)}
                style={[
                  styles.dayButton,
                  (isSelected || isToday) && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: day ? colors.text : 'transparent' },
                    (isSelected || isToday) && {
                      color: '#fff',
                      fontWeight: '700',
                    },
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Ações */}
      <View
        style={[
          styles.actionsContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
       <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
          ]}
        >
          Ações da Agenda
        </Text>

        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor: hasPlan
                ? colors.primary
                : colors.cardHover,
            },
          ]}
          onPress={() => {
            if (!hasPlan) {
              Alert.alert(
                'Plano Necessário',
                'Você precisa de um plano ativo para agendar consultas.'
              );
              return;
            }

            navigation.navigate('Search');
          }}
        >
          <Text
            style={[
              styles.actionButtonText,
              {
                color: hasPlan
                  ? '#fff'
                  : colors.textSecondary,
              },
            ]}
          >
            Agendar Consulta
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            navigation.navigate('ConversationsHistory')
          }
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: '#fff' },
            ]}
          >
            Ver Histórico
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: colors.secondary },
          ]}
          onPress={() => navigation.navigate('Plans')}
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: '#fff' },
            ]}
          >
            Ver Planos
          </Text>
        </Pressable>
      </View>
      {/* Instruções */}
<View
  style={[
    styles.infoBox,
    {
      backgroundColor: colors.cardHover,
      borderColor: colors.border,
    },
  ]}
>
  <Text style={[styles.infoTitle, { color: colors.text }]}>
    Como usar a Agenda
  </Text>

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
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },

  planInfo: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
  },

  planTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  planDetails: {
    fontSize: 14,
    marginTop: 4,
  },

  calendarContainer: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  navBtn: {
    padding: 4,
  },

  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  weekDays: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayButton: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },

  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },

  actionsContainer: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
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
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
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