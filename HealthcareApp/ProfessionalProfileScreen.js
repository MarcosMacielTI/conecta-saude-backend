import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import { useTheme } from './src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfessionalProfileScreen({ route }) {
  const { colors } = useTheme();
  const medico = route.params?.medico || {
    name: 'Profissional',
    specialty: 'Especialidade',
    image: null,
  };
  const name = medico.name || medico.nome || 'Profissional';
  const specialty = medico.specialty || medico.especialidade || 'Especialidade não informada';
  const image = medico.image || medico.imagem || null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {image ? (
        <Image source={{ uri: image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={60} color="white" />
        </View>
      )}
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.specialty, { color: colors.textSecondary }]}>{specialty}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>Perfil do profissional e serviços oferecidos.</Text>
    </View>
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, backgroundColor: '#e5e7eb' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  specialty: { marginBottom: 12, fontSize: 14 },
  description: { textAlign: 'center', fontSize: 14 },
});
