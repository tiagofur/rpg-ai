import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  toggleSound: (value: boolean) => void;
  toggleHaptics: (value: boolean) => void;
  toggleNotifications: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Load settings from storage
    const loadSettings = async () => {
      try {
        const storedSound = await AsyncStorage.getItem('settings_sound');
        const storedHaptics = await AsyncStorage.getItem('settings_haptics');
        const storedNotifs = await AsyncStorage.getItem('settings_notifications');

        if (storedSound !== null) setSoundEnabled(storedSound === 'true');
        if (storedHaptics !== null) setHapticsEnabled(storedHaptics === 'true');
        if (storedNotifs !== null) setNotificationsEnabled(storedNotifs === 'true');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load settings', error);
      }
    };
    void loadSettings();
  }, []);

  const toggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem('settings_sound', String(value));
  };

  const toggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    await AsyncStorage.setItem('settings_haptics', String(value));
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('settings_notifications', String(value));
  };

  return (
    <SettingsContext.Provider
      value={{
        soundEnabled,
        hapticsEnabled,
        notificationsEnabled,
        toggleSound,
        toggleHaptics,
        toggleNotifications,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
