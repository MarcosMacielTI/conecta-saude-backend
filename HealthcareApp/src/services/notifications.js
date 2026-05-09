import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Request permissions for notifications
export const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Permissões de notificação são necessárias para receber alertas de mensagens!');
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return true;
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger: null, // Send immediately
    });
};

// Get push token (for future server-side notifications)
export const getPushToken = async () => {
    try {
        const token = await Notifications.getExpoPushTokenAsync();
        return token.data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
};