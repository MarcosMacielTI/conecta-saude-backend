import React, { useState, useContext, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Pressable, Modal, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './src/context/AuthContext';
import { useThemeColors } from './src/hooks/useTheme';
import BackButton from './src/components/BackButton';
import { professionalsAPI, messagesAPI, connectionsAPI } from './api';
import { useMessagePolling } from './src/hooks/useMessagePolling';
import { sendLocalNotification, requestNotificationPermissions } from './src/services/notifications';
import { EmojiPicker } from './src/components/EmojiPicker';
import { AttachmentPicker } from './src/components/AttachmentPicker';

export default function ChatScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const colors = useThemeColors();

  // Validação de plano para pacientes
  useEffect(() => {
    if (user?.role === 'patient' && (!user.plan || user.plan === 'sem plano')) {
      Alert.alert(
        'Plano Necessário',
        'Você precisa de um plano ativo para conversar com profissionais.',
        [
          { text: 'Ver Planos', onPress: () => navigation.navigate('Plans') },
          { text: 'Voltar', onPress: () => navigation.goBack(), style: 'cancel' }
        ]
      );
      return;
    }
  }, [user, navigation]);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef(null);

  // Initialize notifications
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Use polling hook for real-time updates
  const { messages, loading: pollingLoading, error: pollingError, refreshMessages } = useMessagePolling(
    conversation?._id,
    3000 // Poll every 3 seconds
  );

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        if (user.role === 'patient') {
          let professional = null;

          if (user.professionalId) {
            const response = await professionalsAPI.getById(user.professionalId);
            professional = response.data;
          } else {
            const response = await professionalsAPI.getProfessional();
            professional = response.data;
          }

          if (professional) {
            setConversations([
              {
                id: professional._id || professional.id,
                name: professional.name || 'Profissional',
                specialty: professional.specialty || '',
                lastMessage: 'Seu profissional está disponível para chat.',
                time: '',
                unread: 0,
                contactType: 'professional',
                professional,
              },
            ]);
          }
        } else if (user.role === 'professional') {
          const response = await professionalsAPI.getPatientsAll();
          const patients = response.data || [];
          setConversations(
            patients.map((patient) => ({
              id: patient._id || patient.id,
              name: patient.name || 'Paciente',
              specialty: '',
              lastMessage: 'Paciente conectado.',
              time: '',
              unread: 0,
              contactType: 'patient',
              patient,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load conversations', error);
        setConversations([]);
      }
    };

    loadConversations();
  }, [user?.role, user?.professionalId]);

  useEffect(() => {
    const p = route?.params?.patient || route?.params?.conversation;
    if (p) {
      const conv =
        typeof p === 'string'
          ? { id: Date.now().toString(), name: p, specialty: '', lastMessage: '', time: '', unread: 0 }
          : p;
      setSelectedConversation(conv);
    }
  }, [route?.params]);

  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        // Get connections for the current user
        const connectionsResponse = await connectionsAPI.getConnections();
        const connections = connectionsResponse.data;

        // Find the connection between current user and selected conversation
        let connection = null;
        if (user.role === 'patient') {
          connection = connections.find(conn =>
            conn.patientId === user._id && conn.professionalId === selectedConversation.id
          );
        } else if (user.role === 'professional') {
          connection = connections.find(conn =>
            conn.professionalId === user.professionalId && conn.patientId === selectedConversation.id
          );
        }

        if (connection) {
          setConversation(connection);
          // Load messages for this connection
          const messagesResponse = await messagesAPI.getMessages(connection._id);
          const formattedMessages = messagesResponse.data.map(msg => ({
            _id: msg._id,
            text: msg.content,
            sender: msg.senderType === 'patient' ? 'user' : 'professional',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(formattedMessages);
        } else {
          // No connection found, create a mock connection for now
          const mockConnectionId = `conn_${user._id}_${selectedConversation.id}`;
          setConversation({ _id: mockConnectionId });
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to load messages', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const handleAttachmentSelect = (attachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (!conversation) return;

    try {
      setLoading(true);

      // Send message with connectionId
      const messageData = {
        content: inputText.trim(),
        connectionId: conversation._id,
      };

      await messagesAPI.sendMessage(messageData.content, messageData.connectionId);

      // Clear input
      setInputText('');
      setAttachments([]);

      // Refresh messages immediately
      refreshMessages();

      // Send local notification for demo purposes
      if (selectedConversation) {
        sendLocalNotification(
          'Mensagem enviada',
          `Mensagem enviada para ${selectedConversation.name}`
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Erro', 'Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedConversation) {
    return (
      <View style={[styles.chatContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.chatHeader, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <BackButton onPress={() => setSelectedConversation(null)} />
          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatHeaderName, { color: colors.text }]}>{selectedConversation.name}</Text>
            <Text style={[styles.chatHeaderSpecialty, { color: colors.textSecondary }]}>{selectedConversation.specialty}</Text>
          </View>
          <Ionicons name="call" size={20} color={colors.primary} style={{ marginRight: 16 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.professionalMessage]}>
              <Text style={[styles.messageText, { color: item.sender === 'user' ? '#ffffff' : colors.text }]}>{item.text}</Text>
              <Text style={[styles.messageTime, { color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>{item.timestamp}</Text>
            </View>
          )}
          keyExtractor={(item) => item._id || item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            pollingLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando mensagens...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma mensagem ainda. Comece a conversa!</Text>
              </View>
            )
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.containerBg, borderTopColor: colors.border, borderTopWidth: 1 }]}>
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {attachments.map((attachment, index) => (
                <View key={index} style={[styles.attachmentItem, { backgroundColor: colors.cardHover }]}>
                  {attachment.type === 'image' && (
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                  )}
                  <View style={styles.attachmentInfo}>
                    <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                      {attachment.fileName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(index)}
                    style={styles.removeAttachment}
                  >
                    <Ionicons name="close" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={() => setShowAttachmentPicker(true)}
              style={[styles.actionButton, { backgroundColor: colors.cardHover }]}
            >
              <Ionicons name="attach" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { backgroundColor: colors.cardHover, color: colors.text, borderColor: colors.border }]}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <TouchableOpacity
              onPress={() => setShowEmojiPicker(true)}
              style={[styles.actionButton, { backgroundColor: colors.cardHover }]}
            >
              <Ionicons name="happy" size={20} color={colors.primary} />
            </TouchableOpacity>

            <Pressable
              style={[styles.sendButton, { backgroundColor: (inputText.trim() || attachments.length > 0) ? colors.primary : colors.textTertiary }]}
              onPress={sendMessage}
              disabled={loading || (!inputText.trim() && attachments.length === 0)}
            >
              <Ionicons name={loading ? "time" : "send"} size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {/* Emoji Picker Modal */}
        <EmojiPicker
          visible={showEmojiPicker}
          onSelectEmoji={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />

        {/* Attachment Picker Modal */}
        <Modal
          visible={showAttachmentPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAttachmentPicker(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <AttachmentPicker
              onSelectAttachment={handleAttachmentSelect}
              onClose={() => setShowAttachmentPicker(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conversas</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedConversation(item)}
            style={[styles.conversationCard, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}
          >
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={20} color="#ffffff" />
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={[styles.conversationName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>{item.time}</Text>
              </View>
              <Text style={[styles.conversationSpecialty, { color: colors.textTertiary }]}>{item.specialty}</Text>
              <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  chatHeaderSpecialty: {
    fontSize: 12,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '600',
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationSpecialty: {
    fontSize: 12,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  message: {
    maxWidth: '85%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  professionalMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
    maxWidth: '80%',
  },
  attachmentImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeAttachment: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});