import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GOOGLE_CLIENT_ID, WEB_CLIENT_ID, EXPO_CLIENT_ID, ANDROID_CLIENT_ID, IOS_CLIENT_ID } from '../config/googleConfig';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading } = useContext(AuthContext);
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  console.log('Google redirect URI (add this to Google Console):', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    redirectUri,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    const handleGoogle = async () => {
      if (response?.type === 'success') {
        const idToken = response.params.id_token || response.authentication?.idToken || response.params.idToken;
        if (!idToken) return Alert.alert('Erro', 'Falha ao obter idToken do Google');

        try {
          const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
          const payload = await res.json();
          if (payload?.email) setEmail(payload.email);
          if (payload?.name) setName(payload.name);
          Alert.alert('Google', 'Email preenchido a partir da conta Google. Complete os demais campos.');
        } catch (e) {
          Alert.alert('Erro', 'Não foi possível obter dados do Google');
        }
      }
    };
    handleGoogle();
  }, [response]);

  const handleRegister = async () => {
    console.log('handleRegister called with:', { name, email, cpf, role });
    if (!name || !email || !cpf || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    console.log('Calling register function...');
    const result = await register(name, email, password, cpf, role);
    console.log('Register result:', result);

    if (!result.success) {
      console.log('Registration failed with error:', result.error);
      Alert.alert('Erro', result.error);
      return;
    }

    console.log('Registration successful, letting AuthNavigator handle navigation...');
    // Não precisamos fazer navigation.reset() aqui - o AuthNavigator vai reagir à mudança de estado
    // navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
        >
          <View style={styles.hero}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={styles.heroTitle}>Criar conta</Text>
            <Text style={styles.heroSubtitle}>Escolha seu acesso e seja bem-vindo à Conecta Saúde.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Seus dados</Text>
              <Text style={styles.formDescription}>Preencha as informações abaixo para começar.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="João Silva"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <View style={styles.inputBox}>
                <Ionicons name="document-text-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123.456.789-10"
                  placeholderTextColor="#9ca3af"
                  value={cpf}
                  onChangeText={setCpf}
                  editable={!isLoading}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Usuário</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                  onPress={() => setRole('patient')}
                  disabled={isLoading}
                >
                  <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>Paciente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'professional' && styles.roleButtonActive]}
                  onPress={() => setRole('professional')}
                  disabled={isLoading}
                >
                  <Text style={[styles.roleButtonText, role === 'professional' && styles.roleButtonTextActive]}>Profissional</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>ou</Text>

            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync({ useProxy: true })}>
              <Ionicons name="logo-google" size={20} color="#1f2937" />
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.bottomTextWrapper}>
              <Text style={styles.loginText}>Já tem conta? <Text style={styles.loginLink}>Entre aqui</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2ff',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  hero: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  formHeader: {
    marginBottom: 18,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  formDescription: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: '#0f172a',
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  registerButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  bottomTextWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#475569',
    fontSize: 14,
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
