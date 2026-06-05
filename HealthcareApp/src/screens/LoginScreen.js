import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GOOGLE_CLIENT_ID, WEB_CLIENT_ID, EXPO_CLIENT_ID, ANDROID_CLIENT_ID, IOS_CLIENT_ID } from '../config/googleConfig';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  saveBiometricCredentials,
  getBiometricCredentials
} from '../services/biometricService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { login, googleLogin, isLoading } = useContext(AuthContext);
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  console.log('Google redirect URI (add this to Google Console):', redirectUri);

  const [, response, promptAsync] = Google.useAuthRequest({
    expoClientId: EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    redirectUri,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    initializeBiometrics();
  }, []);

  const initializeBiometrics = async () => {
    const result = await checkBiometricAvailability();
    if (result.available) {
      setBiometricsAvailable(true);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const authResult = await authenticateWithBiometric();

      if (!authResult.success) {
        Alert.alert('Falha', authResult.error || 'Falha na autenticação biométrica');
        setBiometricLoading(false);
        return;
      }

      // Retrieve saved credentials and login
      const credentialsResult = await getBiometricCredentials(email || '');

      if (!credentialsResult.success || !credentialsResult.credentials) {
        Alert.alert('Erro', 'Nenhuma credencial salva encontrada. Por favor, faça login normalmente primeiro.');
        setBiometricLoading(false);
        return;
      }

      const { email: savedEmail, password: savedPassword } = credentialsResult.credentials;
      const loginResult = await login(savedEmail, savedPassword);

      if (loginResult.success) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        Alert.alert('Erro', loginResult.error || 'Falha ao fazer login com dados salvos');
      }
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha na autenticação biométrica');
    } finally {
      setBiometricLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const idToken = response.params.id_token || response.params.idToken || response.authentication?.idToken;
        if (!idToken) return Alert.alert('Erro', 'Falha ao obter idToken do Google');

        const result = await googleLogin(idToken);
        if (!result.success) {
          Alert.alert('Erro', result.error || 'Falha no login com Google');
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Erro', result.error);
      return;
    }

    // Save credentials for biometric login if biometrics available
    if (biometricsAvailable) {
      try {
        await saveBiometricCredentials(email, password);
      } catch (error) {
        console.error('Failed to save credentials:', error);
      }
    }

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
            <Text style={styles.heroSubtitle}>Bem-vindo</Text>
            <Text style={styles.heroTitle}>Conecta Saúde</Text>
            <Text style={styles.heroText}>Gerencie suas consultas, acesse seus profissionais e acompanhe sua saúde com rapidez.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Entrar</Text>
              <Text style={styles.formDescription}>Use sua conta para continuar.</Text>
            </View>

            {biometricsAvailable && (
              <TouchableOpacity
                style={[styles.biometricButton, biometricLoading && styles.disabledButton]}
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
              >
                {biometricLoading ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <>
                    <Ionicons name="finger-print" size={32} color="#2563eb" />
                    <Text style={styles.biometricButtonText}>Entrar com Impressão Digital</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
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
                />
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
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
              <Text style={{ color: '#2563eb', fontSize: 14 }}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>ou</Text>

            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync({ useProxy: true })}>
              <Ionicons name="logo-google" size={20} color="#1f2937" />
              <Text style={styles.googleButtonText}>Entrar com Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.bottomTextWrapper}>
              <Text style={styles.registerText}>Não tem conta? <Text style={styles.registerLink}>Cadastre-se</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewPlansButton} onPress={() => navigation.navigate('Plans')}>
              <Text style={styles.viewPlansButtonText}>Ver Planos Disponíveis</Text>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    backgroundColor: '#2563eb',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 6,
  },
  heroSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  heroTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  heroText: {
    color: '#dbeafe',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  formDescription: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 18,
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
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
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
  registerText: {
    color: '#475569',
    fontSize: 14,
  },
  registerLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
  biometricButton: {
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  biometricButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94a3b8',
    fontSize: 13,
  },
  viewPlansButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  viewPlansButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
