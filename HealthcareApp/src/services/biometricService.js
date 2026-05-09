import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_KEY_PREFIX = '@conectasaude_biometric_';

/**
 * Check if biometric authentication is available and enrolled on the device
 */
export const checkBiometricAvailability = async () => {
    try {
        if (Platform.OS === 'web') {
            return { available: false, reason: 'Web platform not supported' };
        }

        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            return { available: false, reason: 'Device does not have biometric hardware' };
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
            return { available: false, reason: 'No biometric data enrolled' };
        }

        const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        return { available: true, types: biometricTypes };
    } catch (error) {
        console.error('Error checking biometric availability:', error);
        return { available: false, reason: error.message };
    }
};

/**
 * Authenticate user with biometric
 */
export const authenticateWithBiometric = async () => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            reason: 'Autentique-se com sua biometria para entrar',
            fallbackLabel: 'Use seu PIN',
            disableDeviceFallback: false,
            requireConfirmation: true,
        });

        return result;
    } catch (error) {
        console.error('Error during biometric authentication:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Save credentials for biometric login (encrypted by OS)
 */
export const saveBiometricCredentials = async (email, password, userId = null) => {
    try {
        const key = `${BIOMETRIC_KEY_PREFIX}${email}`;
        const credentials = {
            email,
            password,
            userId,
            savedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(key, JSON.stringify(credentials));
        return { success: true };
    } catch (error) {
        console.error('Error saving biometric credentials:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Retrieve saved biometric credentials
 */
export const getBiometricCredentials = async (email) => {
    try {
        const key = `${BIOMETRIC_KEY_PREFIX}${email}`;
        const credentialsJson = await AsyncStorage.getItem(key);
        if (!credentialsJson) {
            return { success: false, error: 'No saved credentials' };
        }
        const credentials = JSON.parse(credentialsJson);
        return { success: true, credentials };
    } catch (error) {
        console.error('Error retrieving biometric credentials:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all saved email addresses for biometric login
 */
export const getSavedBiometricEmails = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const biometricKeys = keys.filter((key) => key.startsWith(BIOMETRIC_KEY_PREFIX));
        const emails = biometricKeys.map((key) => key.replace(BIOMETRIC_KEY_PREFIX, ''));
        return { success: true, emails };
    } catch (error) {
        console.error('Error getting saved emails:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete saved biometric credentials
 */
export const deleteBiometricCredentials = async (email) => {
    try {
        const key = `${BIOMETRIC_KEY_PREFIX}${email}`;
        await AsyncStorage.removeItem(key);
        return { success: true };
    } catch (error) {
        console.error('Error deleting biometric credentials:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear all biometric credentials
 */
export const clearAllBiometricCredentials = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const biometricKeys = keys.filter((key) => key.startsWith(BIOMETRIC_KEY_PREFIX));
        await AsyncStorage.multiRemove(biometricKeys);
        return { success: true };
    } catch (error) {
        console.error('Error clearing biometric credentials:', error);
        return { success: false, error: error.message };
    }
};
