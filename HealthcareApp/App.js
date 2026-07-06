import { useState, useRef, createContext, useContext, useEffect } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, TextInput, Image, FlatList, Switch, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './ChatScreen';
import ConversationsHistoryScreen from './src/screens/ConversationsHistoryScreen';
import VideoScreen from './VideoScreen';
import ActivePlanScreen from './ActivePlanScreen';
import PlansScreen from './PlansScreen';
import ProfessionalScreen from './ProfessionalScreen';
import ProfessionalAgendaScreen from './ProfessionalAgendaScreen';
import ProfessionalSearchScreen from './ProfessionalSearchScreen';
import ProfessionalReportsScreen from './ProfessionalReportsScreen';
import ProfessionalRecordsScreen from './ProfessionalRecordsScreen';
import CalendarScreen from './CalendarScreen';
import { authAPI, professionalsAPI, subscriptionsAPI, connectionsAPI, usersAPI } from './api';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import BackButton from './src/components/BackButton';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: [
    Platform.OS === 'web' ? window.location.origin : 'meusistema://',
  ].filter(Boolean),
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Plans: 'plans',
    },
  },
};

const ProfContext = createContext();

function normalizePlan(plan) {
  if (!plan) return null;
  const value = String(plan).trim().toLowerCase();
  if (value === 'sem plano' || value === 'semplano' || value === 'none' || value === 'no plan') return null;
  return value;
}

function getPlanLabel(plan) {
  const normalized = normalizePlan(plan);
  if (!normalized) return null;
  if (normalized.includes('test')) return 'Premium';
  if (normalized.includes('prem')) return 'Premium';
  if (normalized.includes('inter')) return 'Intermediário';
  if (normalized.includes('basic')) return 'Básico';
  if (normalized === 'básico' || normalized === 'basico') return 'Básico';
  if (normalized === 'intermediário' || normalized === 'intermediario') return 'Intermediário';
  if (normalized === 'premium') return 'Premium';
  return plan;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function HomeScreen({ navigation }) {
  const { profData } = useContext(ProfContext);
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();

  const userName = user?.name ? user.name : 'Usuário';
  const activePlanLabel = getPlanLabel(user?.plan);
  const planText = activePlanLabel ? `Plano ${activePlanLabel} Ativo` : 'Sem plano ativo';
  const consultationsLeft = user?.consultationsLeft ?? 0;
  const greeting = getGreeting();

  const [professional, setProfessional] = useState(null);
  const [professionalLoading, setProfessionalLoading] = useState(true);

  useEffect(() => {
    const loadProfessional = async () => {
      if (!user || user.role !== 'patient') {
        setProfessionalLoading(false);
        return;
      }

      try {
        let prof = null;
        if (user.professionalId) {
          const response = await professionalsAPI.getById(user.professionalId);
          prof = response.data;
        }
        if (!prof) {
          const response = await professionalsAPI.getProfessional();
          prof = response.data;
        }
        setProfessional(prof || null);
      } catch (error) {
        console.error('Erro ao carregar profissional conectado:', error);
        setProfessional(null);
      } finally {
        setProfessionalLoading(false);
      }
    };

    loadProfessional();
  }, [user]);

  return (
    <ScrollView style={[styles.homeContainer, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Cabeçalho */}
      <View style={[styles.headerContainer, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.greetingText, { color: colors.textTertiary }]}>{greeting},</Text>
            <Text style={[styles.userNameText, { color: colors.text }]}>{userName}</Text>
            <View style={[styles.badgeContainer, { backgroundColor: colors.cardHover }]}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>{planText}</Text>
            </View>
          </View>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={24} color="white" />
          </View>
        </View>

        {/* Status da Assinatura */}
        <View style={[styles.consultasCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.consultasContent}>
            <Text style={[styles.consultasLabel, { color: colors.textTertiary }]}>CONSULTAS RESTANTES</Text>
            <Text style={[styles.consultasValue, { color: colors.text }]}>{consultationsLeft} consultas<Text style={[styles.consultasMonth, { color: colors.textSecondary }]}> restantes</Text></Text>
          </View>
          <View style={[styles.consultasIcon, { backgroundColor: colors.cardHover }]}>
            <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      {user?.role === 'patient' && (
        <View style={[styles.connectedProfessionalCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>

          <View style={styles.connectedProfessionalHeader}>
            <Text style={[styles.connectedProfessionalTitle, { color: colors.text }]}>Seu profissional conectado</Text>
            {!professionalLoading && !professional && (
              <Text style={[styles.connectedProfessionalSubtitle, { color: colors.textSecondary }]}>Nenhum profissional encontrado</Text>
            )}
          </View>

          {professionalLoading ? (
            <Text style={[styles.connectedProfessionalSubtitle, { color: colors.textSecondary }]}>Carregando profissional...</Text>
          ) : professional ? (
            <View style={styles.connectedProfessionalInfo}>
              <View style={[styles.connectedProfessionalAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View style={styles.connectedProfessionalDetails}>
                <Text style={[styles.connectedProfessionalName, { color: colors.text }]}>{professional.name || 'Profissional'}</Text>
                <Text style={[styles.connectedProfessionalSpecialty, { color: colors.textSecondary }]}>{professional.specialty || 'Especialidade não informada'}</Text>
                <Text style={[styles.connectedProfessionalClients, { color: colors.textSecondary }]}>{professional.clients?.length ?? 0} paciente(s) conectado(s)</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Ações Rápidas */}
      {user?.role === 'patient' && !activePlanLabel && (
        <View style={[styles.planAlertCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.planAlertTitle, { color: colors.text }]}>Você ainda não possui um plano ativo.</Text>
          <Text style={[styles.planAlertText, { color: colors.textSecondary }]}>Para conversar com profissionais e agendar consultas, escolha um plano.</Text>
          <Pressable onPress={() => navigation.navigate('Plans')} style={[styles.planAlertButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.planAlertButtonText}>Ver Planos</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Como podemos ajudar?</Text>
        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => navigation.navigate('Video')}
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>Videoconsulta</Text>
            <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>Avaliações e Psicologia</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Chat')}
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.success}20` }]}>
              <Ionicons name="chatbubble" size={24} color={colors.success} />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>Chat Rápido</Text>
            <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>Dúvidas simples e ajustes</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('ConversationsHistory')}
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${colors.secondary}20` }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.actionCardTitle, { color: colors.text }]}>Histórico</Text>
            <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>Ver todas as conversas</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>
  );
}

function PatientStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="Video" component={VideoScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ConversationsHistory" component={ConversationsHistoryScreen} />
    </Stack.Navigator>
  );
}

function PatientTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Calendar') {
            iconName = 'calendar';
          } else if (route.name === 'Chat') {
            iconName = 'chatbubble';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: route.name === 'Home' ? 'Início' : route.name === 'Calendar' ? 'Agenda' : route.name === 'Chat' ? 'Conversas' : route.name === 'Search' ? 'Buscar' : 'Perfil',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.containerBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveBackgroundColor: colors.cardHover,
        tabBarInactiveBackgroundColor: colors.containerBg,
        headerShown: false,
        sceneContainerStyle: { backgroundColor: colors.background },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ProfessionalStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfessionalTabs" component={ProfessionalTabNavigator} />
      <Stack.Screen name="Reports" component={ProfessionalReportsScreen} />
      <Stack.Screen name="Records" component={ProfessionalRecordsScreen} />
      <Stack.Screen name="ProfAgenda" component={ProfessionalAgendaScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Video" component={VideoScreen} />
    </Stack.Navigator>
  );
}

function ProfessionalTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'ProfHome') {
            iconName = 'home';
          } else if (route.name === 'ProfAgenda') {
            iconName = 'calendar';
          } else if (route.name === 'ProfChat') {
            iconName = 'chatbubble';
          } else if (route.name === 'ProfSearch') {
            iconName = 'search';
          } else if (route.name === 'ProfProfile') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: route.name === 'ProfHome' ? 'Início' : route.name === 'ProfAgenda' ? 'Agenda' : route.name === 'ProfChat' ? 'Conversas' : route.name === 'ProfSearch' ? 'Buscar' : 'Perfil',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.containerBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveBackgroundColor: colors.cardHover,
        tabBarInactiveBackgroundColor: colors.containerBg,
        headerShown: false,
        sceneContainerStyle: { backgroundColor: colors.background },
      })}
    >
      <Tab.Screen name="ProfHome" component={ProfessionalScreen} />
      <Tab.Screen name="ProfAgenda" component={ProfessionalAgendaScreen} />
      <Tab.Screen name="ProfChat" component={ChatScreen} />
      <Tab.Screen name="ProfSearch" component={ProfessionalSearchScreen} />
      <Tab.Screen name="ProfProfile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, updateUser } = useContext(AuthContext);
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);

  const normalizeProfessional = (prof) => ({
    id: prof._id || prof.id,
    name: prof.name || prof.nome || 'Profissional',
    specialty: prof.specialty || prof.especialidade || 'Especialidade não informada',
    rating: prof.rating ?? prof.avaliacao ?? 0,
    price: prof.price || prof.preco || 'Preço não informado',
    image: prof.image || prof.imagem || 'https://i.pravatar.cc/150?img=5',
    availability: prof.availability || prof.disponibilidade || 'Disponível',
    raw: prof,
  });

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const response = await professionalsAPI.getAll();
      const normalized = response.data.map(normalizeProfessional);
      setProfessionals(normalized);
      setFilteredProfessionals(normalized);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (professionalId) => {
    if (!user) return;
    try {
      setConnectingId(professionalId);
      await connectionsAPI.connect(professionalId);
      Alert.alert('Sucesso', 'Profissional vinculado com sucesso.');
      if (updateUser) {
        updateUser({ ...user, professionalId });
      }
    } catch (error) {
      console.error('Erro ao conectar com profissional:', error);
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível conectar com este profissional.');
    } finally {
      setConnectingId(null);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerQuery = query.trim().toLowerCase();
    if (lowerQuery === '') {
      setFilteredProfessionals(professionals);
      return;
    }

    const filtered = professionals.filter((prof) =>
      prof.name.toLowerCase().includes(lowerQuery) || prof.specialty.toLowerCase().includes(lowerQuery)
    );

    setFilteredProfessionals(filtered);
  };

  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.searchHeader, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.searchTitle, { color: colors.text }]}>Profissionais</Text>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, borderWidth: 1 }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            placeholder="Pesquisar por nome ou especialidade..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>
      {loading ? (
        <View style={styles.searchEmptyState}>
          <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>Carregando profissionais...</Text>
        </View>
      ) : filteredProfessionals.length === 0 ? (
        <View style={styles.searchEmptyState}>
          <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>Nenhum profissional encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProfessionals}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.profListContent}
          renderItem={({ item: medico }) => (
            <Pressable
              onPress={() => navigation.navigate('ProfessionalProfile', { medico })}
              style={[styles.profCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Image source={{ uri: medico.image }} style={styles.profImage} />
              <View style={styles.profContent}>
                <View style={styles.profHeader}>
                  <Text style={[styles.profName, { color: colors.text }]}>{medico.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#eab308" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{medico.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.profSpecialty, { color: colors.textSecondary }]}>{medico.specialty}</Text>
                <View style={styles.profFooter}>
                  <View style={[styles.availabilityBadge, { backgroundColor: `${colors.success}20` }]}>
                    <Ionicons name="time" size={12} color={colors.success} />
                    <Text style={[styles.availabilityText, { color: colors.success }]}> {medico.availability}</Text>
                  </View>
                  <Text style={[styles.profPrice, { color: colors.textTertiary }]}>{medico.price}</Text>
                </View>
                {user?.role === 'patient' && (
                  <Pressable
                    style={[styles.connectButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleConnect(medico.id)}
                    disabled={connectingId === medico.id}
                  >
                    <Text style={styles.connectButtonText}>{connectingId === medico.id ? 'Conectando...' : 'Conectar'}</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function ProfileScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();
  const roleLabel = user?.role === 'professional' ? 'Profissional' : 'Paciente';
  const showPlanCard = user?.role !== 'professional';
  const planLabel = getPlanLabel(user?.plan);
  const planText = planLabel ? `Plano ${planLabel}` : 'Sem plano';
  const consultationsLeft = user?.consultationsLeft ?? 0;
  const profileImageUri = user?.profilePhoto?.url || user?.image || null;

  return (
    <ScrollView style={[styles.profileContainer, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 24 }}>
      <Pressable onPress={() => navigation.navigate('ProfileDetail')} style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <View style={styles.profileAvatarContainer}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileAvatarImage} />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={34} color="white" />
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Usuário'}</Text>
          <Text style={[styles.profileRole, { color: colors.primary }]}>{roleLabel}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'sem e-mail cadastrado'}</Text>
        </View>
      </Pressable>

      <View style={[styles.profileInfoCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.profileInfoLabel, { color: colors.textTertiary }]}>Informações da conta</Text>
        <Text style={[styles.profileInfoText, { color: colors.text }]}>Nome: {user?.name || 'Usuário'}</Text>
        <Text style={[styles.profileInfoText, { color: colors.text }]}>E-mail: {user?.email || 'sem e-mail'}</Text>
        <Text style={[styles.profileInfoText, { color: colors.text }]}>Função: {roleLabel}</Text>
      </View>

      <Pressable style={[styles.primaryButtonLarge, { backgroundColor: colors.primary, marginBottom: 12 }]} onPress={() => navigation.navigate('Config')}>
        <Text style={styles.primaryButtonText}>Configuração</Text>
      </Pressable>

      {showPlanCard && (
        <View style={[styles.activePlanCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.activePlanLabel, { color: colors.textTertiary }]}>Plano ativo</Text>
          <Text style={[styles.activePlanTitle, { color: colors.text }]}>{planText}</Text>
          <Text style={[styles.activePlanDescription, { color: colors.textSecondary }]}>{consultationsLeft} consultas restantes</Text>
          <Pressable style={[styles.primaryButtonLarge, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ActivePlan')}>
            <Text style={styles.primaryButtonText}>Ver Planos</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={[styles.secondaryButtonLarge, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => navigation.navigate('Plans')}>
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Ver planos disponíveis</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfileDetailScreen({ navigation }) {
  const { user, updateUser } = useContext(AuthContext);
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const webFileInputRef = useRef(null);

  const roleLabel = user?.role === 'professional' ? 'Profissional' : 'Paciente';
  const planLabel = getPlanLabel(user?.plan);
  const consultationsLeft = user?.consultationsLeft ?? 0;
  const profileImageUri = user?.profilePhoto?.url || user?.image || null;

  const formatDate = (date) => {
    if (!date) return 'Não informado';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'Não informado';
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const closeModal = () => {
    setModalVisible(false);
    setPhotoError('');
    setUploadProgress(0);
    setSelectedImageUri(null);
    setSelectedImageName(null);
    setSelectedImageFile(null);
    setEditingPhoto(false);
  };

  const waitForModalClose = async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
  };

  const handlePhotoUpload = async (uri, name = 'profile.jpg') => {
    setUploading(true);
    setPhotoError('');

    try {
      let uploadValue;
      let finalName = selectedImageName || name;
      let finalType = 'image/jpeg';

      if (Platform.OS === 'web' && selectedImageFile) {
        uploadValue = selectedImageFile;
        finalName = selectedImageFile.name || finalName;
        finalType = selectedImageFile.type || finalType;
      } else {
        const processed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const uriParts = processed.uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        if (!['jpg', 'jpeg', 'png'].includes(fileType)) {
          throw new Error('Formato inválido. Use JPG ou PNG.');
        }

        uploadValue = {
          uri: processed.uri,
          name: selectedImageName || `profile.${fileType}`,
          type: fileType === 'png' ? 'image/png' : 'image/jpeg',
        };
        finalName = uploadValue.name;
        finalType = uploadValue.type;
      }

      const formData = new FormData();
      if (Platform.OS === 'web' && selectedImageFile) {
        formData.append('photo', uploadValue, finalName);
      } else {
        formData.append('photo', uploadValue);
      }

      const response = await usersAPI.uploadProfilePhoto(formData, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      const updatedUser = response.data?.user || (await authAPI.me()).data;
      if (updatedUser) {
        await updateUser(updatedUser);
      }
      Alert.alert('Sucesso', 'Foto de perfil atualizada.');
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Não foi possível atualizar a foto.';
      setPhotoError(message);
      Alert.alert('Erro', message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      closeModal();
    }
  };

  const openImageLibrary = async () => {
    setModalVisible(false);
    await waitForModalClose();
    if (typeof document !== 'undefined') {
      document.activeElement?.blur?.();
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar uma foto.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    const uri = result.assets?.[0]?.uri || result.uri;
    const wasCancelled = result.canceled === true || result.cancelled === true;
    if (wasCancelled) {
      setModalVisible(true);
      return null;
    }

    if (!uri) {
      setModalVisible(true);
      Alert.alert('Erro', 'Não foi possível obter a imagem selecionada. Tente novamente.');
      return null;
    }

    return uri;
  };

  const selectImageForPreview = (uri, name, file = null) => {
    setSelectedImageUri(uri);
    setSelectedImageName(name || 'profile.jpg');
    setSelectedImageFile(file);
    setEditingPhoto(true);
    setModalVisible(true);
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      webFileInputRef.current?.click();
      return;
    }

    const uri = await openImageLibrary();
    if (!uri) return;

    selectImageForPreview(uri, uri.split('/').pop() || 'profile.jpg');
  };

  const handleWebFileChange = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }

    const uri = URL.createObjectURL(file);
    selectImageForPreview(uri, file.name || 'profile.jpg', file);
    event.target.value = null;
  };

  const pickFile = async () => {
    if (Platform.OS === 'web') {
      webFileInputRef.current?.click();
      return;
    }

    setModalVisible(false);
    await waitForModalClose();
    if (typeof document !== 'undefined') {
      document.activeElement?.blur?.();
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });

    if (result.type === 'cancel') {
      setModalVisible(true);
      return;
    }

    if (!result.uri) {
      setModalVisible(true);
      Alert.alert('Erro', 'Não foi possível obter o arquivo selecionado. Tente novamente.');
      return;
    }

    selectImageForPreview(result.uri, result.name || 'profile.jpg');
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar uma foto.');
      return;
    }

    setModalVisible(false);
    await waitForModalClose();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.activeElement?.blur?.();
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      ...(Platform.OS !== 'web' ? { allowsEditing: true, aspect: [1, 1] } : {}),
    });

    const uri = result.assets?.[0]?.uri || result.uri;
    const wasCancelled = result.canceled === true || result.cancelled === true;
    if (wasCancelled) {
      return;
    }

    if (!uri) {
      Alert.alert('Erro', 'Não foi possível obter a foto tirada. Tente novamente.');
      return;
    }

    setSelectedImageUri(uri);
    setSelectedImageName(uri.split('/').pop() || 'profile.jpg');
    setEditingPhoto(true);
  };

  return (
    <View style={[styles.profileDetailContainer, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' && (
        <input
          ref={webFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}
      <View style={[styles.profileDetailHeader, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.profileDetailTitle, { color: colors.text }]}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={[styles.profileDetailCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileDetailImage} />
          ) : (
            <View style={[styles.profileDetailPlaceholder, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={48} color="white" />
            </View>
          )}

          <Pressable style={[styles.profileDetailEditButton, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
            <Text style={styles.profileDetailEditButtonText}>Editar</Text>
          </Pressable>

          <View style={styles.profileDetailInfo}>
            <Text style={[styles.profileDetailLabel, { color: colors.textTertiary }]}>Nome de usuário</Text>
            <Text style={[styles.profileDetailValue, { color: colors.text }]}>{user?.name || 'Não informado'}</Text>

            <Text style={[styles.profileDetailLabel, { color: colors.textTertiary }]}>CPF</Text>
            <Text style={[styles.profileDetailValue, { color: colors.text }]}>{user?.cpf || 'Não informado'}</Text>

            <Text style={[styles.profileDetailLabel, { color: colors.textTertiary }]}>Conta criada em</Text>
            <Text style={[styles.profileDetailValue, { color: colors.text }]}>{formatDate(user?.createdAt)}</Text>

            {user?.role === 'patient' && (
              <View style={styles.profileDetailPlanRow}>
                <Text style={[styles.profileDetailLabel, { color: colors.textTertiary }]}>Plano</Text>
                <Text style={[styles.profileDetailValue, { color: colors.text }]}>
                  {planLabel ? `${planLabel} • ${consultationsLeft} consultas restantes` : 'Você não possui plano'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {Platform.OS === 'web' ? (
        modalVisible ? (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Editar foto de perfil</Text>
              {!editingPhoto ? (
                <>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={pickImage}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Galeria</Text>
                  </Pressable>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={pickFile}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Arquivo</Text>
                  </Pressable>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={takePhoto}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Câmera</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginBottom: 16 }]}>Ajuste a imagem antes de enviar</Text>
                  <View style={styles.selectedImagePreviewWrapper}>
                    <Image source={{ uri: selectedImageUri }} style={styles.selectedImagePreview} />
                    <View style={styles.cropOverlay} pointerEvents="none" />
                  </View>
                  <Text style={[styles.modalText, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>A imagem será cortada em quadrado e exibida neste círculo de visualização.</Text>
                  <View style={styles.finalCirclePreview}>
                    <Image source={{ uri: selectedImageUri }} style={styles.finalCirclePreviewImage} />
                  </View>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.primary }]} onPress={() => handlePhotoUpload(selectedImageUri)}>
                    <Text style={[styles.modalOptionText, { color: '#fff' }]}>Enviar foto</Text>
                  </Pressable>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={() => {
                    setSelectedImageUri(null);
                    setSelectedImageName(null);
                    setEditingPhoto(false);
                  }}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Escolher outra</Text>
                  </Pressable>
                </>
              )}
              <Pressable style={[styles.modalCancelButton, { borderColor: colors.border }]} onPress={closeModal}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              {uploading && (
                <View style={styles.uploadProgressRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.uploadProgressText, { color: colors.text }]}>{uploadProgress}%</Text>
                </View>
              )}
              {photoError ? <Text style={[styles.errorText, { color: colors.error }]}>{photoError}</Text> : null}
            </View>
          </View>
        ) : null
      ) : (
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Editar foto de perfil</Text>
              {!editingPhoto ? (
                <>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={pickImage}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Galeria</Text>
                  </Pressable>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={pickFile}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Arquivo</Text>
                  </Pressable>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={takePhoto}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Câmera</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginBottom: 16 }]}>Ajuste a imagem antes de enviar</Text>
                  <View style={styles.selectedImagePreviewWrapper}>
                    <Image source={{ uri: selectedImageUri }} style={styles.selectedImagePreview} />
                    <View style={styles.cropOverlay} pointerEvents="none" />
                  </View>
                  <Text style={[styles.modalText, { color: colors.text, textAlign: 'center', marginBottom: 16 }]}>A imagem será cortada em quadrado e exibida neste círculo de visualização.</Text>
                  <View style={styles.finalCirclePreview}>
                    <Image source={{ uri: selectedImageUri }} style={styles.finalCirclePreviewImage} />
                  </View>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.primary }]} onPress={() => handlePhotoUpload(selectedImageUri)}>
                    <Text style={[styles.modalOptionText, { color: '#fff' }]}>Enviar foto</Text>
                  </Pressable>
                  <Pressable style={[styles.modalOptionButton, { backgroundColor: colors.card }]} onPress={() => {
                    setSelectedImageUri(null);
                    setSelectedImageName(null);
                    setEditingPhoto(false);
                  }}>
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>Escolher outra</Text>
                  </Pressable>
                </>
              )}
              <Pressable style={[styles.modalCancelButton, { borderColor: colors.border }]} onPress={closeModal}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              {uploading && (
                <View style={styles.uploadProgressRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.uploadProgressText, { color: colors.text }]}>{uploadProgress}%</Text>
                </View>
              )}
              {photoError ? <Text style={[styles.errorText, { color: colors.error }]}>{photoError}</Text> : null}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function ConfigScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { colors, themeSelection, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const roleLabel = user?.role === 'professional' ? 'Profissional' : 'Paciente';
  const themeOptions = [
    { label: 'Padrão do sistema', value: 'Padrão do sistema' },
    { label: 'Claro', value: 'Claro' },
    { label: 'Escuro', value: 'Escuro' },
  ];

  return (
    <ScrollView style={[styles.configContainer, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <View style={[styles.configHeader, { backgroundColor: colors.background }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.configTitle, { color: colors.text }]}>Configuração</Text>
      </View>
      <View style={styles.configSection}>
        <Text style={[styles.configSectionTitle, { color: colors.text }]}>Conta</Text>
        <Pressable style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View>
            <Text style={[styles.accountCardLabel, { color: colors.textTertiary }]}>Minha conta</Text>
            <Text style={[styles.accountCardName, { color: colors.text }]}>{user?.name || 'Usuário'}</Text>
            <Text style={[styles.accountCardRole, { color: colors.primary }]}>{roleLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.configSection}>
        <Text style={[styles.configSectionTitle, { color: colors.text }]}>Notificações</Text>
        <Text style={[styles.configSectionDescription, { color: colors.textSecondary }]}>Escolha quais você vai receber neste dispositivo e por e-mail.</Text>
        <Pressable
          style={[styles.configItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => setNotificationsEnabled((prev) => !prev)}
        >
          <Text style={[styles.configItemTitle, { color: colors.text }]}>Notificações</Text>
          <Text style={[styles.configItemValue, { color: colors.textTertiary }]}>{notificationsEnabled ? 'Ativadas' : 'Desativadas'}</Text>
        </Pressable>
      </View>

      <View style={styles.configSection}>
        <Text style={[styles.configSectionTitle, { color: colors.text }]}>
          Tema atual: {themeSelection}
        </Text>
        <Text style={[styles.configSectionDescription, { color: colors.textSecondary }]}>
          Padrão do sistema será tratado como Escuro.
        </Text>
        {themeOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.configItem,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              option.value === themeSelection && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setTheme(option.value)}
          >
            <Text style={[styles.configItemTitle, { color: colors.text }]}>{option.label}</Text>
            <Text
              style={[
                styles.configItemValue,
                { color: colors.textTertiary },
                option.value === themeSelection && { color: colors.primary, fontWeight: '700' },
              ]}
            >
              {option.value === themeSelection ? '✓ Selecionado' : 'Selecionar'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.configSection}>
        <Text style={[styles.configSectionTitle, { color: colors.text }]}>Sobre</Text>
        <Text style={[styles.configSectionDescription, { color: colors.textSecondary }]}>Informações do Conecta Saúde</Text>
      </View>

      <Pressable style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={logout}>
        <Text style={styles.logoutButtonText}>Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfessionalProfileScreen({ route, navigation }) {
  const { medico } = route.params;
  const { colors } = useTheme();

  const name = medico.name || medico.nome || 'Profissional';
  const specialty = medico.specialty || medico.especialidade || 'Especialidade não informada';
  const rating = medico.rating ?? medico.avaliacao ?? 0;
  const price = medico.price || medico.preco || 'Preço não informado';
  const availability = medico.availability || medico.disponibilidade || 'Disponível';
  const image = medico.image || medico.imagem || 'https://i.pravatar.cc/150?img=5';

  return (
    <View style={[styles.profProfileContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.profProfileHeader, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <BackButton style={styles.profProfileBackButton} onPress={() => navigation.goBack()} />
        <Image source={{ uri: image }} style={styles.profProfileImage} />
        <View style={styles.profProfileOverlay} />
        <View style={styles.profProfileTextContainer}>
          <Text style={[styles.profProfileName, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.profProfileSpecialty, { color: colors.textSecondary }]}>{specialty}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.profProfileScroll, { backgroundColor: colors.background }]}>
        <View style={styles.profProfileTopRow}>
          <View style={[styles.profProfileRatingBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Ionicons name="star" size={18} color="#eab308" />
            <Text style={[styles.profProfileRatingText, { color: colors.text }]}>{rating}</Text>
            <Text style={[styles.profProfileRatingMeta, { color: colors.textSecondary }]}>({Math.round(rating * 25)} avaliações)</Text>
          </View>
          <Pressable style={[styles.profProfileChatButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Ionicons name="chatbubble" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={[styles.profProfileSectionTitle, { color: colors.text }]}>Sobre</Text>
        <Text style={[styles.profProfileDescription, { color: colors.textSecondary }]}>Especialista cadastrado na plataforma. Atende com foco em cuidado humanizado e acompanhamento contínuo.</Text>

        <View style={[styles.profProfileInfoRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.profProfileInfoLabel, { color: colors.textTertiary }]}>Especialidade</Text>
          <Text style={[styles.profProfileInfoValue, { color: colors.text }]}>{specialty}</Text>
        </View>
        <View style={[styles.profProfileInfoRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.profProfileInfoLabel, { color: colors.textTertiary }]}>Valor</Text>
          <Text style={[styles.profProfileInfoValue, { color: colors.text }]}>{price}</Text>
        </View>
        <View style={[styles.profProfileInfoRow, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.profProfileInfoLabel, { color: colors.textTertiary }]}>Disponibilidade</Text>
          <Text style={[styles.profProfileInfoValue, { color: colors.text }]}>{availability}</Text>
        </View>

        <Text style={[styles.profProfileSectionTitle, { color: colors.text }]}>Horários Disponíveis</Text>
        <View style={styles.profProfileScheduleGrid}>
          {['09:00', '10:30', '14:00', '15:30', '17:00'].map((hora, idx) => (
            <Pressable
              key={idx}
              style={[
                styles.profProfileScheduleButton,
                idx === 1 ? styles.profProfileScheduleButtonActive : styles.profProfileScheduleButtonDefault,
              ]}
            >
              <Text style={[styles.profProfileScheduleText, idx === 1 && styles.profProfileScheduleTextActive]}>{hora}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.profProfileFooter}>
        <Pressable style={[styles.profProfileFooterButtonSecondary, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Ionicons name="chatbubble" size={18} color={colors.primary} />
          <Text style={[styles.profProfileFooterButtonTextSecondary, { color: colors.text }]}>Chat Rápido</Text>
        </Pressable>
        <Pressable style={[styles.profProfileFooterButtonPrimary, { backgroundColor: colors.primary }]}>
          <Ionicons name="videocam" size={18} color="white" />
          <Text style={styles.profProfileFooterButtonTextPrimary}>Agendar Vídeo</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const [profData, setProfData] = useState([
    { name: 'Dra. Ana Souza', specialty: 'Nutricionista', clients: [], balance: 0 },
    { name: 'Dr. Lucas Pereira', specialty: 'Educador Físico', clients: [], balance: 0 },
    { name: 'Dra. Mariana Lima', specialty: 'Psicóloga', clients: [], balance: 0 },
  ]);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ProfContext.Provider value={{ profData, setProfData }}>
            <NavigationContainer linking={linking}>
              <AuthNavigator updateProfData={setProfData} />
              <StatusBar style="light" />
            </NavigationContainer>
          </ProfContext.Provider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthNavigator({ updateProfData }) {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);

  console.log('AuthNavigator render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', !!user);

  if (isLoading) {
    // Tela de carregamento enquanto verifica autenticação
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4338ca' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#4338ca' }, headerTintColor: '#ffffff' }}>
      {isAuthenticated ? (
        // Usuário autenticado - mostra tela principal do tipo correto
        <>
          <Stack.Screen
            name="Main"
            component={user?.role === 'professional' ? ProfessionalStackNavigator : PatientStackNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Config" component={ConfigScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Video" component={VideoScreen} />
          <Stack.Screen name="ActivePlan" component={ActivePlanScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
          <Stack.Screen name="Reports" component={ProfessionalReportsScreen} />
          <Stack.Screen name="Records" component={ProfessionalRecordsScreen} />
          <Stack.Screen name="Plans" component={PlansScreen} options={{ headerShown: false }} />
        </>
      ) : (
        // Usuário não autenticado - mostra tela de login e planos públicos
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Esqueceu a senha?' }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Redefinir senha' }} />
          <Stack.Screen name="Plans" component={PlansScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#eef2ff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
  welcome: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 8,
  },
  subscription: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 14,
    color: '#64748b',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4338ca',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  screenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    fontSize: 16,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  activePlanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  activePlanLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activePlanTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  activePlanDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
    lineHeight: 20,
  },
  planAlertCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 16,
    marginTop: 32,
    marginBottom: 16,
  },
  planAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  planAlertText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  planAlertButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  planAlertButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButtonLarge: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  profileHeaderHint: {
    fontSize: 12,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  profileAvatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    resizeMode: 'cover',
  },
  profileButtonSecondary: {
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  profileButtonSecondaryText: {
    color: '#0f2937',
    fontSize: 15,
    fontWeight: '700',
  },
  configContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  profileDetailContainer: {
    flex: 1,
  },
  profileDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  profileDetailTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileDetailCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  profileDetailImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 20,
  },
  profileDetailPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileDetailEditButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  profileDetailEditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileDetailInfo: {
    width: '100%',
  },
  profileDetailLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileDetailValue: {
    fontSize: 16,
    marginBottom: 14,
  },
  profileDetailPlanRow: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalOptionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectedImagePreviewWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  selectedImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  finalCirclePreview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  finalCirclePreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  circleGuide: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  uploadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  uploadProgressText: {
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  configBackButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  configTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  configSection: {
    marginBottom: 24,
  },
  configSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  configSectionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountCardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 8,
  },
  accountCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  accountCardRole: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  configItem: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configItemSelected: {
    borderColor: '#2563eb',
    borderWidth: 1,
  },
  configItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  configItemValue: {
    fontSize: 14,
    color: '#9ca3af',
  },
  configItemValueSelected: {
    color: '#93c5fd',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planCardSelected: {
    borderColor: '#4338ca',
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338ca',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },
  // HomeScreen Styles
  homeContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerContainer: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#93c5fd',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  badgeContainer: {
    backgroundColor: '#fcd34d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#854d0e',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedProfessionalCard: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
  },
  connectedProfessionalHeader: {
    marginBottom: 14,
  },
  connectedProfessionalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  connectedProfessionalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  connectedProfessionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectedProfessionalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedProfessionalDetails: {
    flex: 1,
  },
  connectedProfessionalName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  connectedProfessionalSpecialty: {
    fontSize: 14,
    marginBottom: 2,
    color: '#6b7280',
  },
  connectedProfessionalClients: {
    fontSize: 12,
    color: '#6b7280',
  },
  consultasCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  consultasContent: {
    flex: 1,
  },
  consultasLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  consultasValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  consultasMonth: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9ca3af',
  },
  consultasIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  plansSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  plansButton: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  plansBtnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  plansBtnSubtitle: {
    fontSize: 13,
    color: '#d1d5db',
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  appointmentProfessional: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#6b7280',
  },
  calendarInfoBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },
  calendarInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  calendarInfoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  // SearchScreen Styles
  searchContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  profListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  profCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  profImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  profContent: {
    flex: 1,
  },
  profHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  profName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profSpecialty: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  profFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityBadge: {
    backgroundColor: '#dcfce7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
  profPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  connectButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  searchEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
  },
  searchEmptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyStateCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
  },
  profileInfoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  profileInfoLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  profileInfoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },
  secondaryButtonLarge: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profProfileContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profProfileHeader: {
    height: 260,
    backgroundColor: '#bfdbfe',
    justifyContent: 'flex-end',
  },
  profProfileBackButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profProfileImage: {
    ...StyleSheet.absoluteFillObject,
  },
  profProfileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  profProfileTextContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  profProfileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profProfileSpecialty: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  profProfileScroll: {
    padding: 24,
    paddingBottom: 140,
  },
  profProfileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profProfileRatingBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profProfileRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profProfileRatingMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  profProfileChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profProfileSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  profProfileDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24,
  },
  profProfileScheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  profProfileScheduleButton: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profProfileScheduleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  profProfileScheduleButtonDefault: {
    backgroundColor: '#ffffff',
  },
  profProfileScheduleText: {
    fontSize: 14,
    color: '#1f2937',
  },
  profProfileScheduleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  profProfileInfoRow: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  profProfileInfoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  profProfileInfoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  profProfileFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profProfileFooterButtonSecondary: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  profProfileFooterButtonPrimary: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  profProfileFooterButtonTextSecondary: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 14,
  },
  profProfileFooterButtonTextPrimary: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});