import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { professionalsAPI, connectionsAPI } from './api';
import { useThemeColors } from './src/hooks/useTheme';
import { AuthContext } from './src/context/AuthContext';

function getPlanLabel(plan) {
  if (!plan) return null;
  const normalized = String(plan).trim().toLowerCase();
  if (normalized === 'sem plano' || normalized === 'semplano') return null;
  if (normalized.includes('test') || normalized.includes('prem')) return 'Premium';
  if (normalized.includes('inter')) return 'Intermediário';
  if (normalized.includes('basic')) return 'Básico';
  if (normalized === 'básico' || normalized === 'basico') return 'Básico';
  return plan;
}

export default function SearchScreen({ navigation }) {
  const colors = useThemeColors();
  const { user, updateUser } = useContext(AuthContext);

  const [professionals, setProfessionals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  const activePlan = getPlanLabel(user?.plan);

  const normalizeProfessional = (prof) => ({
    id: prof._id || prof.id,
    name: prof.name || prof.nome || 'Profissional',
    specialty: prof.specialty || prof.especialidade || 'Especialidade não informada',
    email: prof.email || prof.email || '',
    qualifications: prof.qualifications || prof.qualificacoes || [],
    avatar: prof.image || 'https://i.pravatar.cc/150?img=5',
    price: prof.price || prof.preco || 'Preço não informado',
    availability: prof.availability || prof.disponibilidade || 'Disponível',
    raw: prof,
  });

  const loadProfessionals = async (query = '') => {
    try {
      setLoading(true);
      const response = query.trim()
        ? await professionalsAPI.search(query.trim())
        : await professionalsAPI.getAll();

      const normalized = response.data.map(normalizeProfessional);
      setProfessionals(normalized);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  const handleConnect = async (professionalId) => {
    if (!activePlan) {
      Alert.alert('Plano necessário', 'Escolha um plano para conectar com um profissional.');
      navigation.navigate('Plans');
      return;
    }

    if (user?.professionalId) {
      Alert.alert('Profissional já conectado', 'Você já possui um profissional vinculado.');
      return;
    }

    try {
      setConnecting(professionalId);
      await connectionsAPI.connect(professionalId);

      // Update user context with new professional
      if (updateUser) {
        updateUser({ ...user, professionalId });
      }

      Alert.alert('Sucesso', 'Conectado ao profissional com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao conectar:', error);
      const errorMsg = error.response?.data?.error || 'Erro ao conectar com profissional';
      Alert.alert('Erro', errorMsg);
    } finally {
      setConnecting(null);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    loadProfessionals(query);
  };

  const filteredProfessionals = professionals.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.specialty.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Profissionais</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Pesquisar por nome, email ou CPF"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProfessionals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum profissional encontrado</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Cadastre um profissional para que ele apareça aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProfessionals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('ProfessionalProfile', { medico: item })}
              >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.specialty, { color: colors.textSecondary }]}>{item.specialty}</Text>
                  {item.qualifications?.length > 0 && (
                    <Text style={[styles.qualifications, { color: colors.textSecondary }]}>Qualificações: {item.qualifications.join(', ')}</Text>
                  )}
                  <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
                  <View style={styles.footerInfo}>
                    <Text style={[styles.availability, { color: colors.success }]}>Disponível: {item.availability}</Text>
                    <Text style={[styles.price, { color: colors.textSecondary }]}>{item.price}</Text>
                  </View>
                </View>
              </Pressable>

              {user?.role === 'patient' && !user?.professionalId && (
                <Pressable
                  style={[
                    styles.connectButton,
                    {
                      backgroundColor: activePlan ? colors.primary : colors.border,
                      marginLeft: 12
                    }
                  ]}
                  onPress={() => handleConnect(item.id)}
                  disabled={connecting === item.id || !activePlan}
                >
                  <Text style={styles.connectButtonText}>
                    {connecting === item.id ? 'Conectando...' : 'Conectar'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, margin: 16, borderWidth: 1, borderRadius: 12 },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 14, marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  specialty: { marginTop: 4, fontSize: 14 },
  qualifications: { marginTop: 4, fontSize: 13 },
  email: { marginTop: 4, fontSize: 13 },
  footerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  availability: { fontSize: 13, fontWeight: '600' },
  price: { fontSize: 13 },
  connectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonText: { color: 'white', fontWeight: '700' },
});
