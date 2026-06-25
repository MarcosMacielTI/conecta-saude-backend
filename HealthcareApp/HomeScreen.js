import React, { useContext, useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './src/context/AuthContext';
import { useTheme } from './src/context/ThemeContext';
import { professionalsAPI } from './api';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const planLabel = user?.plan || 'Sem Plano';
  const consultationsLeft = user?.consultationsLeft ?? 0;
  const hasPlan = user?.plan && user.plan !== 'sem plano';

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const response = await professionalsAPI.getAll();
      setProfessionals(response.data.slice(0, 3));
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoCall = () => {
    if (!hasPlan) {
      Alert.alert('Plano Necessário', 'Você precisa de um plano ativo para fazer vídeo chamadas.');
      return;
    }
    navigation.navigate('Video');
  };

  const handleChat = () => {
    if (!hasPlan) {
      Alert.alert('Plano Necessário', 'Você precisa de um plano ativo para conversar com profissionais.');
      return;
    }
    navigation.navigate('Chat');
  };

  const handleHistory = () => {
    navigation.navigate('ConversationsHistory');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      {/* Plano do Usuário */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.planTitle, { color: colors.text }]}>
          {planLabel === 'Sem Plano' ? 'Sem Plano' : `${planLabel} Ativo`}
        </Text>
        {hasPlan && (
          <Text style={[styles.planDetails, { color: colors.textSecondary }]}>
            Consultas restantes: {consultationsLeft}
          </Text>
        )}
      </View>

      {/* Ações Rápidas */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: hasPlan ? colors.primary : colors.cardHover }]}
          onPress={handleVideoCall}
        >
          <Text style={[styles.actionButtonText, { color: hasPlan ? '#fff' : colors.textSecondary }]}>
            Vídeo Consulta
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, { backgroundColor: hasPlan ? colors.primary : colors.cardHover }]}
          onPress={handleChat}
        >
          <Text style={[styles.actionButtonText, { color: hasPlan ? '#fff' : colors.textSecondary }]}>
            Chat Rápido
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleHistory}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>
            Histórico
          </Text>
        </Pressable>
      </View>

      {/* Profissionais em Destaque */}
      <Text style={[styles.title, { color: colors.text }]}>Profissionais em destaque</Text>
      {loading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : professionals.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum profissional disponível</Text>
        </View>
      ) : (
        professionals.map((p) => (
          <Pressable key={p._id || p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => navigation.navigate('ProfessionalProfile', { medico: p })}>
            {p.image ? (
              <Image source={{ uri: p.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={32} color="white" />
              </View>
            )}
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{p.name || p.nome || 'Profissional'}</Text>
              <Text style={[styles.specialty, { color: colors.textSecondary }]}>{p.specialty || p.especialidade || 'Especialidade'}</Text>
            </View>
          </Pressable>
        ))
      )}

      <Pressable style={[styles.seeAllButton, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => navigation.navigate('Search')}>
        <Text style={styles.seeAllButtonText}>Ver todos os profissionais</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  planCard: {
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 12, marginRight: 12, backgroundColor: '#e5e7eb' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  specialty: { fontSize: 14, color: '#6b7280' },
  emptyText: { fontSize: 14, fontWeight: '500' },
  seeAllButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  seeAllButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
