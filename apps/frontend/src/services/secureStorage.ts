import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Servicio de almacenamiento seguro para tokens y datos sensibles.
 * Usa expo-secure-store en dispositivos móviles y AsyncStorage en web.
 */

const KEYS = {
    ACCESS_TOKEN: 'rpg_access_token',
    REFRESH_TOKEN: 'rpg_refresh_token',
    USER_DATA: 'rpg_user_data',
} as const;

type StorageKey = (typeof KEYS)[keyof typeof KEYS];

// En web, SecureStore no funciona, usamos AsyncStorage como fallback
const isWeb = Platform.OS === 'web';

async function setItem(key: StorageKey, value: string): Promise<void> {
    if (isWeb) {
        await AsyncStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
}

async function getItem(key: StorageKey): Promise<string | null> {
    if (isWeb) {
        return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
}

async function removeItem(key: StorageKey): Promise<void> {
    if (isWeb) {
        await AsyncStorage.removeItem(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
}

export interface StoredUser {
    id: string;
    email: string;
    username: string;
    tier?: 'free' | 'premium' | 'vip';
}

export interface StoredTokens {
    accessToken: string;
    refreshToken: string;
}

export const secureStorage = {
    // Tokens
    async saveTokens(tokens: StoredTokens): Promise<void> {
        await Promise.all([
            setItem(KEYS.ACCESS_TOKEN, tokens.accessToken),
            setItem(KEYS.REFRESH_TOKEN, tokens.refreshToken),
        ]);
    },

    async getTokens(): Promise<StoredTokens | null> {
        const [accessToken, refreshToken] = await Promise.all([
            getItem(KEYS.ACCESS_TOKEN),
            getItem(KEYS.REFRESH_TOKEN),
        ]);

        if (!accessToken || !refreshToken) {
            return null;
        }

        return { accessToken, refreshToken };
    },

    async getAccessToken(): Promise<string | null> {
        return getItem(KEYS.ACCESS_TOKEN);
    },

    async getRefreshToken(): Promise<string | null> {
        return getItem(KEYS.REFRESH_TOKEN);
    },

    async clearTokens(): Promise<void> {
        await Promise.all([removeItem(KEYS.ACCESS_TOKEN), removeItem(KEYS.REFRESH_TOKEN)]);
    },

    // User data
    async saveUser(user: StoredUser): Promise<void> {
        await setItem(KEYS.USER_DATA, JSON.stringify(user));
    },

    async getUser(): Promise<StoredUser | null> {
        const userData = await getItem(KEYS.USER_DATA);
        if (!userData) return null;

        try {
            return JSON.parse(userData) as StoredUser;
        } catch {
            return null;
        }
    },

    async clearUser(): Promise<void> {
        await removeItem(KEYS.USER_DATA);
    },

    // Clear all auth data
    async clearAll(): Promise<void> {
        await Promise.all([this.clearTokens(), this.clearUser()]);
    },
};
