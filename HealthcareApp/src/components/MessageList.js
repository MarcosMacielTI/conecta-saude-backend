import React from 'react';
import { FlatList, View, StyleSheet, Text } from 'react-native';
import MessageBubble from './MessageBubble';
import { useTheme } from '../context/ThemeContext';

export default function MessageList({ messages, userId, emptyMessage, loading, listRef }) {
  const { colors } = useTheme();

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id?.toString() || item._id?.toString() || `${item.text}-${item.hora}`}
      renderItem={({ item }) => (
        <MessageBubble message={item} isOutgoing={item.senderId === userId || item.isOutgoing} />
      )}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      inverted
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {loading ? 'Carregando mensagens...' : emptyMessage || 'Nenhuma mensagem ainda.'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  emptyContainer: {
    marginTop: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
});
