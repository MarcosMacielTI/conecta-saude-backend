import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from './src/components/BackButton';
import { useTheme } from './src/context/ThemeContext';

export default function VideoScreen({ navigation, route }) {
  const { colors } = useTheme();
  const patient = route?.params?.patient;
  const targetName = patient?.name || patient?.nome || patient?.patient || 'Profissional';

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [inCall, setInCall] = useState(false);

  const handleStartCall = () => {
    setInCall(true);
  };

  const handleEndCall = () => {
    setInCall(false);
    navigation.goBack();
  };

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

      {/* Área de vídeo principal */}
      <View style={styles.videoArea}>
        {/* Vídeo remoto (profissional/paciente) */}
        <View style={styles.remoteVideo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={80} color="rgba(255,255,255,0.3)" />
          </View>
          {inCall ? (
            <Text style={styles.remoteVideoName}>{targetName}</Text>
          ) : (
            <View style={styles.waitingContainer}>
              <View style={styles.logoContainer}>
                <Ionicons name="medical" size={48} color={colors.primary} />
                <Text style={styles.logoText}>Conecta Saúde</Text>
              </View>
              <Text style={styles.waitingText}>
                {patient
                  ? `Pronto para chamar ${targetName}`
                  : 'Nenhum participante selecionado'}
              </Text>
              <Text style={styles.waitingSubText}>
                Pressione "Iniciar Chamada" quando estiver pronto
              </Text>
            </View>
          )}

          {/* Pill de status */}
          {inCall && (
            <View style={styles.callStatusPill}>
              <View style={styles.recordingDot} />
              <Text style={styles.callStatusText}>Em chamada</Text>
            </View>
          )}
        </View>

        {/* Miniatura do usuário local */}
        {inCall && (
          <View style={styles.localVideoMini}>
            <View style={styles.localVideoInner}>
              <Ionicons name="person" size={28} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.localVideoLabel}>Você</Text>
          </View>
        )}
      </View>

      {/* Controles */}
      <View style={[styles.controls, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        {inCall ? (
          <View style={styles.activeControls}>
            {/* Microfone */}
            <TouchableOpacity
              style={[styles.controlBtn, !micOn && styles.controlBtnOff]}
              onPress={() => setMicOn(!micOn)}
            >
              <Ionicons
                name={micOn ? 'mic' : 'mic-off'}
                size={24}
                color={micOn ? '#fff' : '#ff4444'}
              />
              <Text style={styles.controlLabel}>{micOn ? 'Mudo' : 'Ativar mic'}</Text>
            </TouchableOpacity>

            {/* Encerrar chamada */}
            <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* Câmera */}
            <TouchableOpacity
              style={[styles.controlBtn, !camOn && styles.controlBtnOff]}
              onPress={() => setCamOn(!camOn)}
            >
              <Ionicons
                name={camOn ? 'videocam' : 'videocam-off'}
                size={24}
                color={camOn ? '#fff' : '#ff4444'}
              />
              <Text style={styles.controlLabel}>{camOn ? 'Câmera' : 'Ligar cam'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.startCallBtn, { backgroundColor: colors.primary }]}
            onPress={handleStartCall}
            disabled={!patient}
          >
            <Ionicons name="videocam" size={24} color="#fff" />
            <Text style={styles.startCallText}>Iniciar Chamada</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  remoteVideoName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    position: 'absolute',
    bottom: 24,
    left: 16,
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
  callStatusPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  callStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  localVideoMini: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
  },
  localVideoInner: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
  },
  controlBtnOff: {
    backgroundColor: 'rgba(255,68,68,0.2)',
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    position: 'absolute',
    bottom: -18,
    width: 60,
    textAlign: 'center',
  },
  endCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  startCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startCallText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});