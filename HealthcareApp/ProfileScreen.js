import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Modal, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { AuthContext } from './src/context/AuthContext';
import { useThemeColors } from './src/hooks/useTheme';
import { professionalsAPI, usersAPI } from './api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const colors = useThemeColors();
  const [professional, setProfessional] = useState(null);
  const [loadingProfessional, setLoadingProfessional] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    const loadProfessional = async () => {
      if (!user || user.role !== 'patient') {
        return;
      }

      setLoadingProfessional(true);
      try {
        const response = await professionalsAPI.getAll();
        const prof = Array.isArray(response.data) ? response.data[0] : response.data;
        setProfessional(prof || null);
      } catch (error) {
        console.error('Erro ao carregar profissional conectado:', error);
        setProfessional(null);
      } finally {
        setLoadingProfessional(false);
      }
    };

    loadProfessional();
  }, [user]);

  const openModal = () => setModalVisible(true);
  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
    setPhotoError('');
    setUploadProgress(0);
  };

  const handlePhotoUpload = async () => {
    if (!selectedImage) return;
    setUploading(true);
    setUploadProgress(0);
    setPhotoError('');

    try {
      const processed = await ImageManipulator.manipulateAsync(
        selectedImage,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const uriParts = processed.uri.split('.');
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      const validTypes = ['jpg', 'jpeg', 'png'];
      if (!validTypes.includes(fileType)) {
        Alert.alert('Formato inválido', 'Escolha uma imagem JPG ou PNG.');
        return;
      }

      const formData = new FormData();
      formData.append('photo', {
        uri: processed.uri,
        name: `profile.${fileType}`,
        type: fileType === 'png' ? 'image/png' : 'image/jpeg',
      });

      const response = await usersAPI.uploadProfilePhoto(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      if (response.data?.user) {
        updateUser(response.data.user);
        Alert.alert('Sucesso', 'Foto de perfil atualizada.');
      } else {
        Alert.alert('Sucesso', 'Foto de perfil atualizada.');
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      setPhotoError(error.response?.data?.error || 'Não foi possível atualizar a foto.');
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível atualizar a foto.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
      setModalVisible(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
      setModalVisible(true);
    }
  };

  const removeProfilePhoto = async () => {
    Alert.alert('Remover foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setUploading(true);
          try {
            const response = await usersAPI.deleteProfilePhoto();
            if (response.data?.user) {
              updateUser(response.data.user);
              Alert.alert('Sucesso', 'Foto de perfil removida.');
            } else {
              Alert.alert('Sucesso', 'Foto de perfil removida.');
            }
          } catch (error) {
            console.error('Erro ao remover imagem:', error);
            Alert.alert('Erro', error.response?.data?.error || 'Não foi possível remover a foto.');
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const profileImageUri = user?.profilePhoto?.url || user?.image;
  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user ? (
        <>
          <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <TouchableOpacity onPress={openModal} style={styles.profileAvatarButton} activeOpacity={0.8}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileAvatarImage} />
              ) : (
                <View style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.profileAvatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.editBadgeText}>Editar</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email}</Text>
            </View>
          </View>
          <View style={[styles.profileInfoCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.profileInfoLabel, { color: colors.textTertiary }]}>Informações da conta</Text>
            <Text style={[styles.profileInfoText, { color: colors.text }]}>Nome: {user.name || 'Usuário'}</Text>
            <Text style={[styles.profileInfoText, { color: colors.text }]}>E-mail: {user.email || 'sem e-mail'}</Text>
            <Text style={[styles.profileInfoText, { color: colors.text }]}>Função: {user.role}</Text>
          </View>
          {user.role === 'patient' && (
            <View style={[styles.connectedProfessionalCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.connectedProfessionalLabel, { color: colors.text }]}>Profissional Conectado</Text>
              {loadingProfessional ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : professional ? (
                <View style={styles.connectedProfessionalRow}>
                  <View style={[styles.connectedProfessionalAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.connectedProfessionalAvatarText, { color: '#fff' }]}>{professional.name ? professional.name[0] : 'P'}</Text>
                  </View>
                  <View style={styles.connectedProfessionalInfo}>
                    <Text style={[styles.connectedProfessionalName, { color: colors.text }]}>{professional.name || 'Profissional'}</Text>
                    <Text style={[styles.connectedProfessionalSpecialty, { color: colors.textSecondary }]}>{professional.specialty || 'Especialidade não informada'}</Text>
                    <Text style={[styles.connectedProfessionalClients, { color: colors.textSecondary }]}>{professional.clients?.length ?? 0} paciente(s) conectado(s)</Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.connectedProfessionalSubtitle, { color: colors.textSecondary }]}>Nenhum profissional conectado</Text>
              )}
            </View>
          )}
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={logout}>
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[styles.title, { color: colors.text }]}>Você não está logado</Text>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Editar foto de perfil</Text>
            <View style={styles.imagePreviewWrapper}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.previewImage} />
              ) : (
                <View style={[styles.previewPlaceholder, { backgroundColor: colors.cardHover }]}>
                  <Text style={[styles.previewPlaceholderText, { color: colors.textSecondary }]}>Nenhuma imagem selecionada</Text>
                </View>
              )}
            </View>
            {selectedImage ? (
              <TouchableOpacity style={[styles.primaryModalButton, { backgroundColor: colors.primary }]} onPress={handlePhotoUpload} disabled={uploading}>
                {uploading ? (
                  <View style={styles.progressRow}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.primaryModalButtonText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryModalButtonText}>Salvar foto</Text>
                )}
              </TouchableOpacity>
            ) : null}
            {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}
            <TouchableOpacity style={[styles.modalButton, { borderColor: colors.border }]} onPress={pickImage}>
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Selecionar imagem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { borderColor: colors.border }]} onPress={takePhoto}>
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Tirar foto</Text>
            </TouchableOpacity>
            {profileImageUri ? (
              <TouchableOpacity style={[styles.modalButton, { borderColor: colors.border }]} onPress={removeProfilePhoto}>
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Remover foto</Text>
              </TouchableOpacity>
            ) : null}
            <Pressable onPress={closeModal} style={[styles.modalCloseButton, { borderColor: colors.border }]}>
              <Text style={[styles.modalCloseButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  email: { marginBottom: 20 },
  button: { padding: 12, borderRadius: 10, marginTop: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  profileHeader: { width: '100%', padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileAvatarButton: { marginRight: 16, position: 'relative' },
  profileAvatarImage: { width: 90, height: 90, borderRadius: 45, resizeMode: 'cover' },
  profileAvatarPlaceholder: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  profileAvatarInitial: { color: '#fff', fontSize: 36, fontWeight: '700' },
  editBadge: { position: 'absolute', right: -8, bottom: -8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, elevation: 2 },
  editBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  profileEmail: { fontSize: 14 },
  profileInfoCard: { width: '100%', padding: 18, borderRadius: 18, marginBottom: 20 },
  profileInfoLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  profileInfoText: { fontSize: 15, marginBottom: 6 },
  connectedProfessionalCard: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 18 },
  connectedProfessionalLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  connectedProfessionalRow: { flexDirection: 'row', alignItems: 'center' },
  connectedProfessionalAvatar: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  connectedProfessionalAvatarText: { fontSize: 20, fontWeight: '700' },
  connectedProfessionalInfo: { flex: 1 },
  connectedProfessionalName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  connectedProfessionalSpecialty: { fontSize: 14, marginBottom: 2 },
  connectedProfessionalClients: { fontSize: 12 },
  connectedProfessionalSubtitle: { fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: '100%', padding: 24, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1 },
  modalHandle: { width: 64, height: 6, borderRadius: 3, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  imagePreviewWrapper: { alignItems: 'center', marginBottom: 16 },
  previewImage: { width: 160, height: 160, borderRadius: 80, marginBottom: 16, resizeMode: 'cover' },
  previewPlaceholder: { width: '100%', height: 240, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  previewPlaceholderText: { fontSize: 14 },
  primaryModalButton: { padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  primaryModalButtonText: { color: '#fff', fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: '#ff4d4f', marginBottom: 12, textAlign: 'center' },
  modalButton: { padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  modalButtonText: { fontSize: 15, fontWeight: '700' },
  modalCloseButton: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 8, borderWidth: 1 },
  modalCloseButtonText: { fontSize: 15 },
});
