import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EMOJIS = [
    '😊', '😂', '❤️', '👍', '👎', '👋', '🙏', '🎉', '🔥', '💯',
    '😍', '🤔', '😢', '😭', '😤', '😴', '🤗', '🤩', '🥺', '😎',
    '🤝', '👏', '🙌', '🤞', '✌️', '🤟', '👌', '👍', '👎', '👊',
    '✋', '🖐️', '👋', '🤚', '🖖', '✍️', '🙏', '💪', '🦾', '🦿',
    '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴',
    '👀', '👁️', '👅', '👄', '💋', '🩸', '💉', '💊', '🩹', '🩼'
];

export const EmojiPicker = ({ visible, onSelectEmoji, onClose }) => {
    const handleEmojiSelect = (emoji) => {
        onSelectEmoji(emoji);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    maxHeight: '60%',
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 15,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Escolha um emoji</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'space-around',
                        }}>
                            {EMOJIS.map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleEmojiSelect(emoji)}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        margin: 5,
                                        borderRadius: 8,
                                        backgroundColor: '#f5f5f5',
                                    }}
                                >
                                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};