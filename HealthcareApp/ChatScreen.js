import React, { useState, useContext, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Pressable, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './src/context/AuthContext';
import { useThemeColors } from './src/hooks/useTheme';
import BackButton from './src/components/BackButton';
import { professionalsAPI, messagesAPI, connectionsAPI, BASE_API_URL } from './api';
import { sendLocalNotification, requestNotificationPermissions } from './src/services/notifications';
import { EmojiPicker } from './src/components/EmojiPicker';
import { AttachmentPicker } from './src/components/AttachmentPicker';
import { io } from 'socket.io-client';

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
  const [pollLoading, setPollLoading] = useState(false);

  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize notifications
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Socket.IO setup
  useEffect(() => {
    socketRef.current = io(BASE_API_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO');
    });

    socketRef.current.on('receiveMessage', (message) => {
      if (selectedConversation && message.senderId !== user.id) {
        const formattedMessage = {
          _id: message._id,
          text: message.content,
          sender: message.senderType === 'patient' ? 'user' : 'professional',
          timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, formattedMessage]);
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user.id, selectedConversation]);

  // Join chat room when conversation changes
  useEffect(() => {
    if (selectedConversation && conversation?._id) {
      socketRef.current?.emit('joinChat', conversation._id);
    }
  }, [selectedConversation, conversation]);

  // Load conversations on mount or when user role changes
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const connectionsResponse = await connectionsAPI.getConnections();
        const connections = connectionsResponse.data?.connections || connectionsResponse.data || [];

        if (user.role === 'patient') {
          // Get professional for patient
          if (connections.length > 0) {
            const connection = connections[0];
            const professional = connection.professionalId;
            setConversations([
              {
                id: professional._id || professional.id,
                name: professional.name || 'Profissional',
                specialty: professional.specialty || '',
                lastMessage: 'Clique para conversar',
                time: '',
                unread: 0,
                contactType: 'professional',
                professional,
                connectionId: connection._id,
              },
            ]);
          }
        } else if (user.role === 'professional') {
          // Get patients for professional
          const convList = connections.map((connection) => ({
            id: connection.patientId._id || connection.patientId.id,
            name: connection.patientId.name || 'Paciente',
            specialty: '',
            lastMessage: 'Clique para conversar',
            time: '',
            unread: 0,
            contactType: 'patient',
            patient: connection.patientId,
            connectionId: connection._id,
          }));
          setConversations(convList);
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.role, user?.professionalId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const connectionId = selectedConversation.connectionId;

        if (connectionId) {
          // Set conversation with necessary IDs
          setConversation({
            _id: connectionId,
            professionalId: selectedConversation.professionalId,
            patientId: selectedConversation.patientId,
          });

          // Load messages for this connection
          const messagesResponse = await messagesAPI.getMessages(connectionId);
          const formattedMessages = (messagesResponse.data || []).map(msg => ({
            _id: msg._id,
            text: msg.content,
            sender: msg.senderType === 'patient' ? 'user' : 'professional',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(formattedMessages);

          // Scroll to end after loading messages
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
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
    if (!conversation || !conversation._id) {
      Alert.alert('Erro', 'Conexão não encontrada.');
      return;
    }

    // Check plan limits for basic plan
    if (user?.role === 'patient' && user?.plan === 'Básico') {
      // For basic plan, limit messages (this is a simple check, in production you'd track message count)
      const recentMessages = messages.filter(msg => msg.sender === 'user').length;
      if (recentMessages >= 10) { // Arbitrary limit for demo
        Alert.alert('Limite atingido', 'Seu plano básico permite apenas mensagens limitadas. Atualize para um plano superior.');
        return;
      }
    }

    try {
      setLoading(true);

      const messageData = {
        chatId: conversation._id,
        senderId: user.id,
        receiverId: user.role === 'patient' ? conversation.professionalId : conversation.patientId,
        text: inputText.trim(),
      };

      // Send via Socket.IO
      socketRef.current?.emit('sendMessage', messageData);

      // Add to local messages immediately
      const newMessage = {
        _id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);

      // Clear input and attachments
      setInputText('');
      setAttachments([]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send local notification
      if (selectedConversation) {
        sendLocalNotification(
          'Mensagem enviada',
          `Mensagem enviada para ${selectedConversation.name}`
        );
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
          <Pressable onPress={() => navigation.navigate('Video', { contact: selectedConversation })}>
            <Ionicons name="call" size={20} color={colors.primary} style={{ marginRight: 16 }} />
          </Pressable>
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
            loading || pollLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando mensagens...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
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
              maxLength={500}
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando conversas...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma conversa disponível</Text>
          {user?.role === 'patient' && (
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Conecte-se com um profissional na aba Buscar</Text>
          )}
        </View>
      ) : (
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
      )}
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
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderSpecialty: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  message: {
    marginVertical: 6,
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  professionalMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  attachmentsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  attachmentImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 14,
    fontWeight: '600',
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationSpecialty: {
    fontSize: 12,
    marginBottom: 2,
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
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
