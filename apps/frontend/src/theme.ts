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
