import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { messagesAPI } from '../../api';
import BackButton from '../components/BackButton';

export default function ConversationsHistoryScreen({ navigation }) {
    const { colors } = useTheme();
    const { user } = useContext(AuthContext);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            // For now, we'll get the current conversation
            // In the future, we might need an endpoint to get all conversations for a user
            const response = await messagesAPI.getConversation();
            if (response.data) {
                setConversations([response.data]);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            Alert.alert('Erro', 'Não foi possível carregar as conversas.');
        } finally {
            setLoading(false);
        }
    };

    const formatLastMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Agora';
        } else if (diffInHours < 24) {
            return `${diffInHours}h atrás`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d atrás`;
        }
    };

    const renderConversation = ({ item }) => {
        const isPatient = user?.role === 'patient';
        const otherUser = isPatient ? item.professionalId : item.patientId;

        return (
            <TouchableOpacity
                style={[styles.conversationItem, { backgroundColor: colors.containerBg, borderBottomColor: colors.border }]}
                onPress={() => navigation.navigate('Chat', { conversationId: item._id })}
            >
                <View style={styles.conversationAvatar}>
                    <Ionicons
                        name={isPatient ? "person-circle" : "medical"}
                        size={50}
                        color={colors.primary}
                    />
                </View>

                <View style={styles.conversationInfo}>
                    <Text style={[styles.conversationName, { color: colors.text }]}>
                        {otherUser?.name || 'Usuário'}
                    </Text>
                    <Text style={[styles.conversationLastMessage, { color: colors.textSecondary }]}>
                        {item.lastMessage || 'Nenhuma mensagem ainda'}
                    </Text>
                </View>

                <View style={styles.conversationMeta}>
                    <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
                        {item.updatedAt ? formatLastMessageTime(item.updatedAt) : ''}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <BackButton navigation={navigation} />
                    <Text style={[styles.title, { color: colors.text }]}>Conversas</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Carregando conversas...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <BackButton navigation={navigation} />
                <Text style={[styles.title, { color: colors.text }]}>Conversas</Text>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={64} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Nenhuma conversa encontrada
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                        Suas conversas aparecerão aqui
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item._id}
                    style={styles.conversationsList}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    conversationsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
    },
    conversationAvatar: {
        marginRight: 15,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    conversationLastMessage: {
        fontSize: 14,
    },
    conversationMeta: {
        alignItems: 'flex-end',
    },
    conversationTime: {
        fontSize: 12,
        marginBottom: 5,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});