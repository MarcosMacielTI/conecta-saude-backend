import React from 'react';
import { View, StyleSheet, Text, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentPicker } from './AttachmentPicker';

export default function Chat({
  user,
  conversation,
  messages,
  messageListRef,
  onMessageListContentSizeChange,
  inputText,
  attachments,
  loading,
  pollLoading,
  showEmojiPicker,
  showAttachmentPicker,
  setShowEmojiPicker,
  setShowAttachmentPicker,
  handleEmojiSelect,
  handleAttachmentSelect,
  removeAttachment,
  onSend,
  onChangeText,
  onBack,
  onCall,
  status,
}) {
  const { colors, theme } = useTheme();
  // WhatsApp wallpaper color
  const wallpaperColor = theme === 'Claro' ? '#ece5dd' : '#0a1419';

  return (
    <View style={[styles.container, { backgroundColor: wallpaperColor }]}>
      <View style={[styles.wallpaper, { backgroundColor: wallpaperColor }]} />
      <ChatHeader
        title={conversation.name}
        subtitle={conversation.specialty ? `${conversation.specialty} • ${status}` : status}
        onBack={onBack}
        onCall={onCall}
      />

      <View style={styles.content}>
        <MessageList
          messages={messages}
          userId={user.id}
          loading={loading || pollLoading}
          emptyMessage="Nenhuma mensagem ainda. Comece a conversa!"
          listRef={messageListRef}
          onContentSizeChange={onMessageListContentSizeChange}
        />
      </View>

      {attachments.length > 0 && (
        <View style={[styles.attachmentsContainer, { backgroundColor: colors.card }]}>
          {attachments.map((attachment, index) => (
            <View key={index} style={[styles.attachmentItem, { backgroundColor: colors.cardHover }]}>
              <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>{attachment.fileName}</Text>
            </View>
          ))}
        </View>
      )}

      <ChatInput
        value={inputText}
        onChangeText={onChangeText}
        onSend={onSend}
        onAttach={() => setShowAttachmentPicker(true)}
        onEmoji={() => setShowEmojiPicker(true)}
        disabled={loading || (!inputText.trim() && attachments.length === 0)}
      />

      <EmojiPicker
        visible={showEmojiPicker}
        onSelectEmoji={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />

      <Modal
        visible={showAttachmentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <AttachmentPicker
            onSelectAttachment={handleAttachmentSelect}
            onClose={() => setShowAttachmentPicker(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  attachmentsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  attachmentItem: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  attachmentName: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
