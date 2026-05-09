import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthContext } from './src/context/AuthContext';
import { useThemeColors } from './src/hooks/useTheme';
import { professionalsAPI } from './api';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const colors = useThemeColors();
  const [professional, setProfessional] = useState(null);
  const [loadingProfessional, setLoadingProfessional] = useState(false);

  useEffect(() => {
    const loadProfessional = async () => {
      if (!user || user.role !== 'patient') {
        return;
      }

      setLoadingProfessional(true);
      try {
        const response = await professionalsAPI.getAll();
        const prof = Array.isArray(response.data) ? response.data[0] : response.data;
        setProfessional(prof || null);
      } catch (error) {
        console.error('Erro ao carregar profissional conectado:', error);
        setProfessional(null);
      } finally {
        setLoadingProfessional(false);
      }
    };

    loadProfessional();
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Olá, {user.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
          {user.role === 'patient' && (
            <View style={[styles.connectedProfessionalCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>            
              <Text style={[styles.connectedProfessionalLabel, { color: colors.text }]}>Profissional Conectado</Text>
              {loadingProfessional ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : professional ? (
                <View style={styles.connectedProfessionalRow}>
                  <View style={[styles.connectedProfessionalAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.connectedProfessionalAvatarText, { color: '#fff' }]}>{professional.name ? professional.name[0] : 'P'}</Text>
                  </View>
                  <View style={styles.connectedProfessionalInfo}>
                    <Text style={[styles.connectedProfessionalName, { color: colors.text }]}>{professional.name || 'Profissional'}</Text>
                    <Text style={[styles.connectedProfessionalSpecialty, { color: colors.textSecondary }]}>{professional.specialty || 'Especialidade não informada'}</Text>
                    <Text style={[styles.connectedProfessionalClients, { color: colors.textSecondary }]}>{professional.clients?.length ?? 0} paciente(s) conectado(s)</Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.connectedProfessionalSubtitle, { color: colors.textSecondary }]}>Nenhum profissional conectado</Text>
              )}
            </View>
          )}
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={logout}>
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[styles.title, { color: colors.text }]}>Você não está logado</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  email: { marginBottom: 20 },
  button: { padding: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
  connectedProfessionalCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },
  connectedProfessionalLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  connectedProfessionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectedProfessionalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedProfessionalAvatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  connectedProfessionalInfo: {
    flex: 1,
  },
  connectedProfessionalName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  connectedProfessionalSpecialty: {
    fontSize: 14,
    marginBottom: 2,
  },
  connectedProfessionalClients: {
    fontSize: 12,
  },
  connectedProfessionalSubtitle: {
    fontSize: 13,
  },
});
