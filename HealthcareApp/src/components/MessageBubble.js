import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MessageStatus from './MessageStatus';
import { useTheme } from '../context/ThemeContext';

const statusIcons = {
  sent: require('../../assets/visto1.png'),
  delivered: require('../../assets/visto2.png'),
  read: require('../../assets/visto3.png'),
};

export default function MessageBubble({ message, isOutgoing }) {
  const { colors, theme } = useTheme();

  // WhatsApp-style colors based on theme
  const outgoingBubbleColor = theme === 'Claro' ? '#dcf8c6' : '#056162';
  const incomingBubbleColor = theme === 'Claro' ? '#ffffff' : '#1f4a4a';
  const outgoingTextColor = theme === 'Claro' ? '#000000' : '#e0f2f1';
  const incomingTextColor = theme === 'Claro' ? '#000000' : '#e0f2f1';
  const outgoingTimeColor = theme === 'Claro' ? '#888888' : '#b3d9d9';
  const incomingTimeColor = theme === 'Claro' ? '#888888' : '#b3d9d9';

  const bubbleStyle = [
    styles.bubble,
    isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
    {
      backgroundColor: isOutgoing ? outgoingBubbleColor : incomingBubbleColor,
      shadowOpacity: theme === 'Claro' ? 0.08 : 0.12,
    },
  ];

  const textStyle = [
    styles.text,
    { color: isOutgoing ? outgoingTextColor : incomingTextColor },
  ];

  const timeStyle = [
    styles.time,
    { color: isOutgoing ? outgoingTimeColor : incomingTimeColor },
  ];

  return (
    <View style={[styles.container, isOutgoing ? styles.outgoing : styles.incoming]}>
      <View style={bubbleStyle}>
        <Text style={textStyle}>{message.texto || message.text}</Text>
        <View style={styles.metaRow}>
          <Text style={timeStyle}>{message.hora || message.timestamp}</Text>
          {isOutgoing && <MessageStatus status={message.status} iconSources={statusIcons} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  outgoing: {
    alignItems: 'flex-end',
  },
  incoming: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  outgoingBubble: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  incomingBubble: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    marginRight: -2,
  },
  statusWrapper: {
    marginLeft: 4,
  },
  time: {
    fontSize: 12,
    letterSpacing: 0,
    fontWeight: '400',
  },
});
