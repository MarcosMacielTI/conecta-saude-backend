import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export const AttachmentPicker = ({ onSelectAttachment, onClose }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const pickImage = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                const image = result.assets[0];
                setSelectedImage(image);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    const takePhoto = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a câmera.');
                return;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                const image = result.assets[0];
                setSelectedImage(image);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Erro', 'Não foi possível tirar a foto.');
        }
    };

    const handleConfirm = () => {
        if (selectedImage) {
            onSelectAttachment({
                type: 'image',
                uri: selectedImage.uri,
                fileName: selectedImage.fileName || `image_${Date.now()}.jpg`,
                mimeType: 'image/jpeg',
            });
            onClose();
        }
    };

    return (
        <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
        }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                Anexar imagem
            </Text>

            {selectedImage && (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Image
                        source={{ uri: selectedImage.uri }}
                        style={{ width: 200, height: 150, borderRadius: 10 }}
                        resizeMode="cover"
                    />
                </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                <TouchableOpacity
                    onPress={pickImage}
                    style={{
                        alignItems: 'center',
                        padding: 15,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 10,
                        flex: 1,
                        marginRight: 10,
                    }}
                >
                    <Ionicons name="images" size={24} color="#007AFF" />
                    <Text style={{ marginTop: 5, fontSize: 12 }}>Galeria</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={takePhoto}
                    style={{
                        alignItems: 'center',
                        padding: 15,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 10,
                        flex: 1,
                        marginLeft: 10,
                    }}
                >
                    <Ionicons name="camera" size={24} color="#007AFF" />
                    <Text style={{ marginTop: 5, fontSize: 12 }}>Câmera</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                    onPress={onClose}
                    style={{
                        flex: 1,
                        padding: 15,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 10,
                        marginRight: 10,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: '#666' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!selectedImage}
                    style={{
                        flex: 1,
                        padding: 15,
                        backgroundColor: selectedImage ? '#007AFF' : '#ccc',
                        borderRadius: 10,
                        marginLeft: 10,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: 'white' }}>Anexar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};