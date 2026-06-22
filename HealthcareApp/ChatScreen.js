import React, { useState, useContext, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './src/context/AuthContext';
import { useThemeColors } from './src/hooks/useTheme';
import Chat from './src/components/Chat';
import { professionalsAPI, messagesAPI, connectionsAPI, BASE_API_URL } from './api';
import { sendLocalNotification, requestNotificationPermissions } from './src/services/notifications';
import { EmojiPicker } from './src/components/EmojiPicker';
import { AttachmentPicker } from './src/components/AttachmentPicker';
import { io } from 'socket.io-client';

export default function ChatScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const colors = useThemeColors();
  const routeConversationId = route?.params?.conversationId;
  const routePatient = route?.params?.patient;

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
  const [onlineUsers, setOnlineUsers] = useState({});

  const getPresenceKey = (id) => id?.toString?.() || '';

  const formatPresenceStatus = (presence) => {
    if (!presence) return 'Offline';
    if (presence.online) return 'Online';
    if (presence.lastSeen) {
      const date = new Date(presence.lastSeen);
      return `Visto por último às ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Offline';
  };

  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const receivedMessageIdsRef = useRef(new Set());

  // Initialize notifications
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Socket.IO setup
  useEffect(() => {
    if (!user?.id) return;

    let socket;
    let mounted = true;

    const initializeSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!mounted) return;

      socket = io(BASE_API_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Connected to Socket.IO', socket.id);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connect error:', error.message || error);
      });

      socket.on('onlineUsers', (userIds) => {
        const presence = {};
        (userIds || []).forEach((id) => {
          const key = getPresenceKey(id);
          if (key) presence[key] = { online: true, lastSeen: null };
        });
        setOnlineUsers((prev) => ({ ...prev, ...presence }));
      });

      socket.on('lastSeenUsers', (lastSeenPayload) => {
        const presence = {};
        Object.entries(lastSeenPayload || {}).forEach(([id, lastSeen]) => {
          const key = getPresenceKey(id);
          if (key) presence[key] = { online: false, lastSeen };
        });
        setOnlineUsers((prev) => ({ ...prev, ...presence }));
      });

      socket.on('presenceUpdate', ({ userId, online, lastSeen }) => {
        const key = getPresenceKey(userId);
        if (!key) return;
        setOnlineUsers((prev) => ({
          ...prev,
          [key]: {
            online: !!online,
            lastSeen: online ? null : lastSeen || prev[key]?.lastSeen || new Date().toISOString(),
          },
        }));
      });

      socket.on('conversationUpdate', ({ connectionId, lastMessage, updatedAt, unreadCount }) => {
        setConversations((prev) => prev.map((conv) => {
          if (conv.connectionId.toString() !== connectionId.toString()) return conv;
          return {
            ...conv,
            lastMessage: lastMessage || conv.lastMessage,
            time: updatedAt ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : conv.time,
            unread: typeof unreadCount === 'number' ? unreadCount : conv.unread,
          };
        }));
      });

      socket.on('receiveMessage', (message) => {
        if (!message?._id || message.senderId?.toString() === user.id?.toString()) return;
        const messageKey = message._id.toString();
        if (receivedMessageIdsRef.current.has(messageKey)) return;
        receivedMessageIdsRef.current.add(messageKey);

        const activeConversation = selectedConversationRef.current;
        const messageConnectionId = message.connectionId?.toString();
        const activeConnectionId = activeConversation?._id?.toString() || activeConversation?.connectionId?.toString();

        const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedMessage = {
          _id: message._id,
          texto: message.content,
          hora: timestamp,
          status: message.status || 'sent',
          senderId: message.senderId,
          isOutgoing: message.senderId?.toString() === user.id?.toString(),
          pending: false,
        };

        if (activeConnectionId === messageConnectionId) {
          setMessages(prev => {
            if (prev.some(msg => msg._id === formattedMessage._id)) return prev;
            return [...prev, formattedMessage];
          });
        } else {
          sendLocalNotification(
            'Nova mensagem',
            message.senderName ? `Nova mensagem de ${message.senderName}` : 'Você recebeu uma nova mensagem'
          );
        }

        setConversations((prev) => prev.map((conv) => {
          if (conv.connectionId.toString() !== messageConnectionId) return conv;
          return {
            ...conv,
            lastMessage: formattedMessage.texto,
            time: formattedMessage.hora,
            unread: activeConnectionId === messageConnectionId ? 0 : (conv.unread || 0) + 1,
          };
        }));
      });

      socket.on('messageStatusUpdate', ({ messageId, status }) => {
        setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, status } : msg));
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketRef.current = socket;
    };

    initializeSocket();

    return () => {
      mounted = false;
      socket?.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Join chat room when conversation changes
  useEffect(() => {
    if (selectedConversation && conversation?._id) {
      socketRef.current?.emit('joinChat', conversation._id);
      socketRef.current?.emit('markAsRead', conversation._id);
    }
  }, [selectedConversation, conversation]);

  // Load conversations on mount or when user role changes
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [connectionsResponse, conversationsResponse] = await Promise.all([
          connectionsAPI.getConnections(),
          messagesAPI.getConversations(),
        ]);

        const connections = connectionsResponse.data?.connections || connectionsResponse.data || [];
        const conversationsData = (conversationsResponse.data?.conversations || conversationsResponse.data || []);
        const conversationByConnectionId = new Map(conversationsData.map((conv) => [conv.connectionId.toString(), conv]));

        const buildConversation = (connection) => {
          const otherUser = user.role === 'patient' ? connection.professionalId : connection.patientId;
          const otherUserId = otherUser?.userId || otherUser?._id || otherUser?.id;
          const convMeta = conversationByConnectionId.get(connection._id.toString()) || {};
          return {
            _id: connection._id,
            id: otherUserId,
            name: otherUser?.name || (user.role === 'patient' ? 'Profissional' : 'Paciente'),
            specialty: user.role === 'patient' ? otherUser?.specialty || '' : '',
            lastMessage: convMeta.lastMessage || 'Clique para conversar',
            time: convMeta.updatedAt ? new Date(convMeta.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unread: convMeta.unreadCount || 0,
            contactType: user.role === 'patient' ? 'professional' : 'patient',
            connectionId: connection._id,
            professional: connection.professionalId,
            patient: connection.patientId,
          };
        };

        if (user.role === 'patient') {
          if (connections.length > 0) {
            const list = [buildConversation(connections[0])];
            setConversations(list);
            if (routeConversationId && routeConversationId.toString() === connections[0]._id.toString()) {
              setSelectedConversation(list[0]);
            }
          } else {
            setConversations([]);
          }
        } else if (user.role === 'professional') {
          const convList = connections.map(buildConversation);
          setConversations(convList);
          if (routeConversationId) {
            const selected = convList.find((conv) => conv.connectionId.toString() === routeConversationId.toString() || conv._id.toString() === routeConversationId.toString());
            if (selected) {
              setSelectedConversation(selected);
            }
          } else if (routePatient) {
            const selected = convList.find((conv) => conv.patient?._id?.toString() === routePatient._id?.toString() || conv.patient?.id?.toString() === routePatient.id?.toString() || conv.id?.toString() === routePatient._id?.toString() || conv.id?.toString() === routePatient.id?.toString());
            if (selected) {
              setSelectedConversation(selected);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [navigation, user?.role, user?.professionalId, routeConversationId, routePatient]);
  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        setMessages([]);
        setLoading(true);
        const connectionId = selectedConversation.connectionId;

        if (connectionId) {
          setConversation({
            _id: connectionId,
            professionalId: selectedConversation.professionalId,
            patientId: selectedConversation.patientId,
          });

          setConversations((prev) => prev.map((conv) => {
            if (conv.connectionId?.toString() !== connectionId.toString()) return conv;
            return { ...conv, unread: 0 };
          }));

          const messagesResponse = await messagesAPI.getMessages(connectionId);
          const formattedMessages = (messagesResponse.data || [])
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(msg => {
              const senderId = msg.senderId?._id || msg.senderId;
              return {
                _id: msg._id,
                texto: msg.content,
                hora: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: msg.status || 'sent',
                senderId,
                isOutgoing: senderId?.toString() === user.id,
                pending: false,
              };
            });
          setMessages(formattedMessages);
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
        text: inputText.trim(),
      };

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tempId = `pending-${Date.now()}`;
      const newMessage = {
        _id: tempId,
        texto: inputText.trim(),
        hora: timestamp,
        status: 'sent',
        senderId: user.id,
        isOutgoing: true,
        pending: true,
      };

      setMessages(prev => [newMessage, ...prev]);
      setConversations((prev) => prev.map((conv) => {
        if (conv.connectionId?.toString() !== conversation._id.toString()) return conv;
        return {
          ...conv,
          lastMessage: newMessage.texto,
          time: newMessage.hora,
          unread: 0,
        };
      }));

      socketRef.current?.emit('sendMessage', messageData, (response) => {
        if (response?.success && response.message) {
          setMessages(prev => prev.map(msg => msg._id === tempId ? {
            ...msg,
            _id: response.message._id,
            status: response.message.status || msg.status,
            pending: false,
          } : msg));
        }
      });
      setInputText('');
      setAttachments([]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedConversation) {
    return (
      <Chat
        user={user}
        conversation={selectedConversation}
        messages={messages}
        messageListRef={flatListRef}
        inputText={inputText}
        attachments={attachments}
        loading={loading}
        pollLoading={pollLoading}
        showEmojiPicker={showEmojiPicker}
        showAttachmentPicker={showAttachmentPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        setShowAttachmentPicker={setShowAttachmentPicker}
        handleEmojiSelect={handleEmojiSelect}
        handleAttachmentSelect={handleAttachmentSelect}
        removeAttachment={removeAttachment}
        onSend={sendMessage}
        onChangeText={setInputText}
        onBack={() => setSelectedConversation(null)}
        onCall={() => navigation.navigate('Video', { contact: selectedConversation })}
        status={formatPresenceStatus(onlineUsers[getPresenceKey(selectedConversation?.id)])}
      />
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
              style={[styles.conversationCard, { backgroundColor: 'transparent', borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            >
              <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={20} color="#ffffff" />
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <View style={styles.conversationTitleBlock}>
                    <Text style={[styles.conversationName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.presenceRow}>
                      <View
                        style={[
                          styles.presenceDot,
                          { backgroundColor: onlineUsers[item.id] ? '#25D366' : '#6B7280' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.presenceText,
                          { color: onlineUsers[item.id]?.online ? '#25D366' : colors.textTertiary },
                        ]}
                      >
                        {formatPresenceStatus(onlineUsers[item.id])}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.badgeColumn}>
                    <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>{item.time}</Text>
                    {item.unread > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.primary, marginTop: 8 }]}>
                        <Text style={styles.unreadText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.conversationSpecialty, { color: colors.textTertiary }]}>{item.specialty}</Text>
                <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
              </View>

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
  outgoingMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 5,
    marginLeft: 40,
  },
  incomingMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2F2F2F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 20,
    marginRight: 40,
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
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '700',
  },
  conversationTime: {
    fontSize: 12,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  conversationSpecialty: {
    fontSize: 12,
    marginBottom: 2,
  },
  conversationTitleBlock: {
    flexDirection: 'column',
    flex: 1,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  presenceText: {
    fontSize: 11,
    fontWeight: '500',
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
