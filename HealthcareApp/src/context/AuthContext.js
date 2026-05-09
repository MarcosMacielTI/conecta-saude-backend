import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      console.log('Bootstrapping auth...');
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      console.log('Retrieved from storage - token:', !!savedToken, 'user:', !!savedUser);

      if (savedToken) {
        setToken(savedToken);
        setUser(savedUser ? JSON.parse(savedUser) : null);
        console.log('Auth state restored successfully');
      } else {
        console.log('No saved auth data found');
      }
    } catch (e) {
      console.error('Failed to restore token', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, cpf, role) => {
    setIsLoading(true);
    console.log('Starting registration with:', { name, email, cpf, role });
    try {
      console.log('Calling authService.register...');
      const response = await authService.register({ name, email, password, cpf, role });
      console.log('Registration API response:', response.data);
      const { token, user } = response.data;

      console.log('Saving token to AsyncStorage...');
      await AsyncStorage.setItem('token', token);
      console.log('Saving user to AsyncStorage...');
      await AsyncStorage.setItem('user', JSON.stringify(user));

      console.log('Setting state...');
      setToken(token);
      setUser(user);
      console.log('Registration successful! isAuthenticated should be true now');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { success: false, error: error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    setIsLoading(true);
    try {
      const response = await authService.googleAuth(idToken);
      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.message || 'Google login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to logout', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (update) => {
    try {
      const updatedUser = typeof update === 'function' ? update(user) : update;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Failed to update user', error);
      return { success: false, error };
    }
  }, [user]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
