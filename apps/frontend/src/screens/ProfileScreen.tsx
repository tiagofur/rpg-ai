import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS } from '../theme';
import { useGameEffects } from '../hooks/useGameEffects';
import { useSettings } from '../context/SettingsContext';

interface ProfileScreenProps {
  onClose: () => void;
  onLogout: () => void;
  onOpenSubscription?: () => void;
  username?: string;
  email?: string;
}

export function ProfileScreen({
  onClose,
  onLogout,
  onOpenSubscription,
  username = 'Adventurer',
  email = 'hero@rpg.ai',
}: ProfileScreenProps) {
  const { t } = useTranslation();
  const { playHaptic } = useGameEffects();
  const {
    soundEnabled,
    hapticsEnabled,
    notificationsEnabled,
    toggleSound,
    toggleHaptics,
    toggleNotifications,
  } = useSettings();

  const handleToggleSound = (value: boolean) => {
    playHaptic('light');
    toggleSound(value);
  };

  const handleToggleHaptics = (value: boolean) => {
    if (value) playHaptic('medium');
    toggleHaptics(value);
  };

  const handleToggleNotifications = (value: boolean) => {
    playHaptic('light');
    toggleNotifications(value);
  };

  const handleLogout = () => {
    playHaptic('medium');
    Alert.alert(t('common.logout'), t('common.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: onLogout,
      },
    ]);
  };

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('common.settings')}</Text>
        <TouchableOpacity
          onPress={() => {
            playHaptic('light');
            onClose();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={styles.profileCard}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => playHaptic('light')}>
              <Text style={styles.editButtonText}>✎</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Premium Button */}
          {onOpenSubscription && (
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => {
                playHaptic('medium');
                onOpenSubscription();
              }}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumGradient}
              >
                <Text style={styles.premiumButtonText}>
                  💎 {t('game.premium') || 'Get Premium'}
                </Text>
                <Text style={styles.premiumButtonSubtext}>Unlock exclusive features</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Settings Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.general')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.sound')}</Text>
              <Text style={styles.settingDescription}>{t('settings.soundDesc')}</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{ false: '#333', true: COLORS.primary }}
              thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.haptics')}</Text>
              <Text style={styles.settingDescription}>{t('settings.hapticsDesc')}</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: '#333', true: COLORS.primary }}
              thumbColor={hapticsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.notifications')}</Text>
              <Text style={styles.settingDescription}>{t('settings.notificationsDesc')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#333', true: COLORS.primary }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => playHaptic('light')}>
            <Text style={styles.menuItemText}>{t('settings.help')}</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => playHaptic('light')}>
            <Text style={styles.menuItemText}>{t('settings.privacy')}</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => playHaptic('light')}>
            <Text style={styles.menuItemText}>{t('settings.terms')}</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>v1.0.0 (Build 2025.11.25)</Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#050510',
    fontSize: 24,
    fontFamily: FONTS.title,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.bodyBold,
    marginBottom: 4,
  },
  email: {
    color: COLORS.textDim,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 20,
  },
  premiumButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    color: '#050510',
    fontSize: 18,
    fontFamily: FONTS.title,
    marginBottom: 4,
  },
  premiumButtonSubtext: {
    color: '#050510',
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    opacity: 0.8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.body,
    marginBottom: 4,
  },
  settingDescription: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  menuItemArrow: {
    color: COLORS.textDim,
    fontSize: 20,
    fontFamily: FONTS.body,
  },
  logoutContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 16,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 50, 50, 0.5)',
    backgroundColor: 'rgba(255, 50, 50, 0.1)',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ff5050',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 1,
  },
  versionText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.body,
    opacity: 0.5,
  },
});
