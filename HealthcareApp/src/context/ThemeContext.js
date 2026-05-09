import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema base com cores padronizadas
export const themeColors = {
    Claro: {
        // Cores principais
        background: '#f3f4f6',
        containerBg: '#ffffff',
        text: '#0f172a',
        textSecondary: '#475569',
        textTertiary: '#94a3b8',

        // Bordas e separadores
        border: '#e2e8f0',
        borderLight: '#f1f5f9',

        // Cores de ação
        primary: '#2563eb',
        primaryLight: '#3b82f6',
        primaryDark: '#1d4ed8',
        secondary: '#64748b',
        secondaryLight: '#94a3b8',

        // Estados
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',

        // Cards e containers
        card: '#ffffff',
        cardHover: '#f9fafb',
        cardActive: '#f1f5f9',

        // Inputs
        inputBg: '#f8fafc',
        inputBorder: '#e2e8f0',
        inputFocus: '#2563eb',
        inputError: '#ef4444',

        // Botões
        buttonPrimary: '#2563eb',
        buttonSecondary: '#64748b',
        buttonSuccess: '#10b981',
        buttonWarning: '#f59e0b',
        buttonError: '#ef4444',

        // Status
        statusActive: '#10b981',
        statusInactive: '#94a3b8',
        statusPending: '#f59e0b',

        // Sombras (para iOS)
        shadow: 'rgba(0, 0, 0, 0.1)',
        shadowLight: 'rgba(0, 0, 0, 0.05)',

        // Gradientes
        gradientPrimary: ['#2563eb', '#3b82f6'],
        gradientSecondary: ['#64748b', '#94a3b8'],
    },
    Escuro: {
        // Cores principais
        background: '#050f1c',
        containerBg: '#0f172a',
        text: '#f1f5f9',
        textSecondary: '#cbd5e1',
        textTertiary: '#94a3b8',

        // Bordas e separadores
        border: '#1e293b',
        borderLight: '#334155',

        // Cores de ação
        primary: '#3b82f6',
        primaryLight: '#60a5fa',
        primaryDark: '#2563eb',
        secondary: '#64748b',
        secondaryLight: '#94a3b8',

        // Estados
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',

        // Cards e containers
        card: '#1e293b',
        cardHover: '#334155',
        cardActive: '#475569',

        // Inputs
        inputBg: '#0f172a',
        inputBorder: '#334155',
        inputFocus: '#3b82f6',
        inputError: '#ef4444',

        // Botões
        buttonPrimary: '#3b82f6',
        buttonSecondary: '#64748b',
        buttonSuccess: '#10b981',
        buttonWarning: '#f59e0b',
        buttonError: '#ef4444',

        // Status
        statusActive: '#10b981',
        statusInactive: '#94a3b8',
        statusPending: '#f59e0b',

        // Sombras (para iOS)
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowLight: 'rgba(0, 0, 0, 0.2)',

        // Gradientes
        gradientPrimary: ['#3b82f6', '#60a5fa'],
        gradientSecondary: ['#64748b', '#94a3b8'],
    },
};

// Context para o tema
const ThemeContext = createContext();

// Hook personalizado para usar o tema
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Função para obter o tema atual baseado na seleção
export const getThemeMode = (themeSelection, systemColorScheme = 'dark') => {
    if (themeSelection === 'Padrão do sistema') {
        return systemColorScheme === 'light' ? 'Claro' : 'Escuro';
    }
    if (themeSelection === 'Claro' || themeSelection === 'Escuro') {
        return themeSelection;
    }
    return 'Escuro';
};

// Função para obter as cores do tema
export const getThemeColors = (themeName) => {
    return themeColors[themeName] || themeColors.Escuro;
};

// Provider do tema
export const ThemeProvider = ({ children }) => {
    const [themeSelection, setThemeSelection] = useState('Padrão do sistema');
    const [isLoading, setIsLoading] = useState(true);
    const systemColorScheme = useColorScheme();

    // Carregar tema salvo no AsyncStorage
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('themeSelection');
                if (savedTheme) {
                    setThemeSelection(savedTheme);
                }
            } catch (error) {
                console.error('Erro ao carregar tema:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();
    }, []);

    // Salvar tema no AsyncStorage quando mudar
    const setTheme = async (newTheme) => {
        try {
            setThemeSelection(newTheme);
            await AsyncStorage.setItem('themeSelection', newTheme);
        } catch (error) {
            console.error('Erro ao salvar tema:', error);
        }
    };

    // Tema atual baseado na seleção
    const currentTheme = getThemeMode(themeSelection, systemColorScheme);
    const colors = getThemeColors(currentTheme);

    const value = {
        // Estado
        theme: currentTheme,
        themeSelection,
        colors,
        isLoading,

        // Ações
        setTheme,

        // Utilitários
        getThemeColors: (themeName) => getThemeColors(themeName),
        getThemeMode: (selection) => getThemeMode(selection, systemColorScheme),
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;