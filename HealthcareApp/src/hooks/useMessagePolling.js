import { useState, useEffect, useCallback } from 'react';
import { messagesAPI } from '../../api';

export const useMessagePolling = (conversationId, interval = 5000) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastMessageCount, setLastMessageCount] = useState(0);

    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await messagesAPI.getMessages(conversationId);
            const newMessages = response.data;

            // Check if there are new messages
            if (newMessages.length > lastMessageCount) {
                setMessages(newMessages);
                setLastMessageCount(newMessages.length);
            }
        } catch (err) {
            setError(err.message || 'Erro ao buscar mensagens');
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    }, [conversationId, lastMessageCount]);

    // Initial load
    useEffect(() => {
        fetchMessages();
    }, [conversationId]);

    // Polling effect
    useEffect(() => {
        if (!conversationId) return;

        const pollInterval = setInterval(fetchMessages, interval);

        return () => clearInterval(pollInterval);
    }, [conversationId, interval, fetchMessages]);

    const refreshMessages = useCallback(() => {
        fetchMessages();
    }, [fetchMessages]);

    return {
        messages,
        loading,
        error,
        refreshMessages,
    };
};