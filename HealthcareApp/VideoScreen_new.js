import React, { useState, useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './src/context/ThemeContext';
import { AuthContext } from './src/context/AuthContext';

export default function VideoScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useContext(AuthContext);
  const contact = typeof route?.params?.contact === 'object' ? route?.params?.contact : null;
  const contactId = route?.params?.contactId || contact?.id || contact?._id || contact?.connectionId;
  const contactName = route?.params?.contactName || contact?.name;
  const contactType = route?.params?.contactType || contact?.contactType;
  const connectionId = route?.params?.connectionId || contact?.connectionId;

  const appointment = typeof route?.params?.appointment === 'object' ? route?.params?.appointment : null;
  const appointmentVideoLink = route?.params?.appointmentVideoLink || appointment?.videoLink;
  const appointmentPatientName = route?.params?.appointmentPatientName || appointment?.patientId?.name || appointment?.patient?.name;
  const appointmentPatientId = route?.params?.appointmentPatientId || appointment?.patientId?._id || appointment?.patientId?.id || appointment?.patient?._id || appointment?.patient?.id;

  const targetName = user?.role === 'professional'
    ? contactName || appointmentPatientName || 'Paciente'
    : contactName || appointment?.professionalId?.name || 'Profissional';

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [inCall, setInCall] = useState(false);

  // Gerar ID único para a sala Jitsi
  const roomId = appointmentVideoLink?.split('/').pop() || connectionId || contactId || `call_${Date.now()}`;
  const jitsiUrl = `https://meet.jit.si/${roomId}`;

  const canStartCall = user?.role === 'professional' || !!contactId || !!appointmentVideoLink;

  const handleStartCall = () => {
    if (!canStartCall) {
      Alert.alert('Não autorizado', 'Apenas profissionais podem iniciar chamadas.');
      return;
    }
    setInCall(true);
  };

  const handleEndCall = () => {
    setInCall(false);
    navigation.goBack();
  };

  if (inCall) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

        {/* Jitsi Meet WebView */}
        {Platform.OS === 'web' ? (
          <View style={styles.webView}>
            <iframe
              title="Jitsi Meet"
              src={jitsiUrl}
              style={styles.iframe}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
            />
          </View>
        ) : (
          (() => {
            const RNWebView = require('react-native-webview').WebView;
            return (
              <RNWebView
                source={{ uri: jitsiUrl }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onError={(error) => {
                  console.error('WebView error:', error);
                  Alert.alert('Erro', 'Falha ao carregar vídeo chamada');
                }}
              />
            );
          })()
        )}

        {/* Botão de encerrar */}
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0a0a1a' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1a1a2e', borderBottomColor: '#333', borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Vídeo Chamada</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Área de vídeo preparatória */}
      <View style={styles.videoArea}>
        <View style={styles.remoteVideo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={80} color="rgba(255,255,255,0.3)" />
          </View>

          <View style={styles.waitingContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="medical" size={48} color={colors.primary} />
              <Text style={styles.logoText}>Conecta Saúde</Text>
            </View>
            <Text style={styles.waitingText}>
              {appointment || contact
                ? user?.role === 'professional'
                  ? `Chamar ${targetName}`
                  : `Aguardando ${targetName}`
                : 'Nenhum contato selecionado'}
            </Text>
            <Text style={styles.waitingSubText}>
              {user?.role === 'professional'
                ? 'Pressione para iniciar a chamada de vídeo'
                : 'O profissional iniciará a chamada'}
            </Text>
          </View>
        </View>
      </View>

      {/* Botão iniciar chamada */}
      <View style={[styles.controls, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <TouchableOpacity
          style={[styles.startCallBtn, { backgroundColor: canStartCall ? colors.primary : '#666' }]}
          onPress={handleStartCall}
          disabled={!canStartCall}
        >
          <Ionicons name="videocam" size={24} color="#fff" />
          <Text style={styles.startCallText}>
            {user?.role === 'professional' ? 'Iniciar Chamada' : 'Aguardando...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  webView: {
    flex: 1,
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  endCallButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarPlaceholder: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.2,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  waitingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  startCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startCallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
