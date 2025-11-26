import { StyleSheet } from 'react-native';

export const COLORS = {
    background: '#050510',
    primary: '#f7cf46',
    secondary: '#2a2a35',
    text: '#f5f5f5',
    textDim: 'rgba(255,255,255,0.6)',
    success: '#4caf50',
    error: '#ff8080',
    hp: '#ff4d4d',
    mp: '#4d79ff',
    xp: '#b366ff',
    cardBg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
};

// Extended theme object for new components
export const theme = {
    colors: {
        // Base
        background: '#050510',
        surface: '#0a0a1a',
        card: 'rgba(255,255,255,0.05)',

        // Text
        text: '#f5f5f5',
        textSecondary: 'rgba(255,255,255,0.7)',
        textMuted: 'rgba(255,255,255,0.4)',

        // Brand
        gold: '#f7cf46',
        goldDark: '#b8982f',
        primary: '#f7cf46',

        // Semantic
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#ef4444',
        info: '#3b82f6',

        // Stats
        hp: '#ff4d4d',
        mp: '#4d79ff',
        xp: '#b366ff',
        stamina: '#4caf50',

        // UI
        border: 'rgba(255,255,255,0.1)',
        borderFocus: 'rgba(247, 207, 70, 0.5)',
        overlay: 'rgba(0,0,0,0.7)',
    },
    fonts: {
        title: 'Cinzel_700Bold',
        body: 'Lato_400Regular',
        bodyBold: 'Lato_700Bold',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
    },
};

export const FONTS = {
    title: 'Cinzel_700Bold',
    body: 'Lato_400Regular',
    bodyBold: 'Lato_700Bold',
};

export const COMMON_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontFamily: FONTS.title,
        fontSize: 24,
        color: COLORS.primary,
        textShadowColor: 'rgba(247, 207, 70, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    card: {
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: FONTS.bodyBold,
        color: COLORS.background,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
