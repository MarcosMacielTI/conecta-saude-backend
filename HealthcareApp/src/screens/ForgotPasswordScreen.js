import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService, API_BASE_URL } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    console.log('Solicitando reset de senha para', email);
    if (!email) {
      return Alert.alert('Erro', 'Informe seu email.');
    }

    setLoading(true);
    try {
      const response = await authService.requestPasswordReset(email);
      console.log('Resposta do reset de senha', response?.data);
      setResetRequested(true);
      if (response.data.resetToken) {
        Alert.alert('Sucesso', 'Token gerado. Copie o código recebido e use-o para redefinir a senha.');
      } else {
        Alert.alert('Sucesso', 'Se o email existir, você receberá um código para redefinir a senha.');
      }
    } catch (error) {
      console.error('Erro ao solicitar reset de senha', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || error.response?.data?.message || error.message || 'Falha ao solicitar redefinição de senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !password || !confirmPassword) {
      return Alert.alert('Erro', 'Preencha todos os campos.');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Erro', 'As senhas precisam ser iguais.');
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      Alert.alert('Sucesso', 'Senha redefinida com sucesso.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert(
        'Erro',
        error.response?.data?.error || error.response?.data?.message || error.message || 'Falha ao redefinir a senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Redefinição de senha</Text>
          <Text style={styles.subtitle}>
            Informe seu email para receber um código de redefinição.
          </Text>
          <Text style={styles.debugText}>API: {API_BASE_URL}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRequestReset} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Solicitar código</Text>
            )}
          </TouchableOpacity>

          {resetRequested && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Código de redefinição"
                autoCapitalize="none"
                value={token}
                onChangeText={setToken}
              />
              <TextInput
                style={styles.input}
                placeholder="Nova senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.buttonText}>Redefinir senha</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  inner: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
});
