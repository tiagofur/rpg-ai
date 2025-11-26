/**
 * SettingsScreen - User preferences and account settings
 *
 * Includes toggles for sound, music, haptics, notifications,
 * account management, and app information.
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../theme';

// Icons as text (replace with actual icons if available)
const ICONS = {
  sound: '🔊',
  music: '🎵',
  haptics: '📳',
  notifications: '🔔',
  subscription: '💎',
  language: '🌐',
  privacy: '🔒',
  terms: '📜',
  support: '💬',
  about: 'ℹ️',
  logout: '🚪',
  delete: '🗑️',
  back: '←',
};

interface SettingsScreenProps {
  onGoBack?: () => void;
  onNavigateToSubscription?: () => void;
}

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
  destructive?: boolean;
}

const SettingRow = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  onPress,
  showArrow = false,
  destructive = false,
}: SettingRowProps) => {
  const isToggle = value !== undefined && onValueChange !== undefined;

  const content = (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, destructive && styles.destructiveText]}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {isToggle && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.secondary, true: COLORS.primary }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
          ios_backgroundColor={COLORS.secondary}
        />
      )}
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection = ({ title, children }: SettingSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export default function SettingsScreen({
  onGoBack,
  onNavigateToSubscription,
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const {
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    notificationsEnabled,
    toggleSound,
    toggleMusic,
    toggleHaptics,
    toggleNotifications,
  } = useSettings();

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || '1';

  const handleLogout = useCallback(() => {
    Alert.alert(
      t('settings.logout.title', 'Log Out'),
      t('settings.logout.message', 'Are you sure you want to log out?'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout.confirm', 'Log Out'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              // Logout failed silently
            }
          },
        },
      ]
    );
  }, [logout, t]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('settings.deleteAccount.title', 'Delete Account'),
      t(
        'settings.deleteAccount.message',
        'This action is permanent and cannot be undone. All your data, characters, and progress will be lost.'
      ),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.deleteAccount.confirm', 'Delete Forever'),
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert(
              t('common.info', 'Info'),
              t(
                'settings.deleteAccount.contactSupport',
                'Please contact support to delete your account.'
              )
            );
          },
        },
      ]
    );
  }, [t]);

  const handleLanguageChange = useCallback(() => {
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
    ];

    const currentLang = i18n.language;
    const langButtons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'cancel' | 'default' | 'destructive';
    }> = languages.map((lang) => ({
      text: lang.name + (lang.code === currentLang ? ' ✓' : ''),
      onPress: () => {
        void i18n.changeLanguage(lang.code);
      },
    }));

    langButtons.push({
      text: t('common.cancel', 'Cancel'),
      style: 'cancel',
    });

    Alert.alert(t('settings.language.title', 'Language'), undefined, langButtons);
  }, [i18n, t]);

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const handleSupport = useCallback(() => {
    openLink('mailto:support@rpgai.app?subject=RPG-AI%20Support');
  }, [openLink]);

  const handleSubscription = useCallback(() => {
    if (onNavigateToSubscription) {
      onNavigateToSubscription();
    } else {
      Alert.alert(
        t('common.info', 'Info'),
        t('settings.subscription.notAvailable', 'Subscription management coming soon.')
      );
    }
  }, [onNavigateToSubscription, t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onGoBack ? (
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{ICONS.back}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.headerTitle}>{t('settings.title', 'Settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        {user && (
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Game Settings */}
        <SettingSection title={t('settings.sections.game', 'Game')}>
          <SettingRow
            icon={ICONS.sound}
            label={t('settings.sound.label', 'Sound Effects')}
            description={t('settings.sound.description', 'Game sounds and effects')}
            value={soundEnabled}
            onValueChange={toggleSound}
          />
          <SettingRow
            icon={ICONS.music}
            label={t('settings.music.label', 'Background Music')}
            description={t('settings.music.description', 'Ambient music during gameplay')}
            value={musicEnabled}
            onValueChange={toggleMusic}
          />
          <SettingRow
            icon={ICONS.haptics}
            label={t('settings.haptics.label', 'Haptic Feedback')}
            description={t('settings.haptics.description', 'Vibration on actions')}
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title={t('settings.sections.notifications', 'Notifications')}>
          <SettingRow
            icon={ICONS.notifications}
            label={t('settings.notifications.label', 'Push Notifications')}
            description={t('settings.notifications.description', 'Receive game updates and alerts')}
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </SettingSection>

        {/* Account */}
        <SettingSection title={t('settings.sections.account', 'Account')}>
          <SettingRow
            icon={ICONS.subscription}
            label={t('settings.subscription.label', 'Subscription')}
            description={t('settings.subscription.description', 'Manage your plan')}
            onPress={handleSubscription}
            showArrow
          />
          <SettingRow
            icon={ICONS.language}
            label={t('settings.language.label', 'Language')}
            description={i18n.language === 'es' ? 'Español' : 'English'}
            onPress={handleLanguageChange}
            showArrow
          />
        </SettingSection>

        {/* Support & Legal */}
        <SettingSection title={t('settings.sections.support', 'Support & Legal')}>
          <SettingRow
            icon={ICONS.support}
            label={t('settings.support.label', 'Contact Support')}
            onPress={handleSupport}
            showArrow
          />
          <SettingRow
            icon={ICONS.privacy}
            label={t('settings.privacy.label', 'Privacy Policy')}
            onPress={() => openLink('https://rpgai.app/privacy')}
            showArrow
          />
          <SettingRow
            icon={ICONS.terms}
            label={t('settings.terms.label', 'Terms of Service')}
            onPress={() => openLink('https://rpgai.app/terms')}
            showArrow
          />
        </SettingSection>

        {/* About */}
        <SettingSection title={t('settings.sections.about', 'About')}>
          <SettingRow
            icon={ICONS.about}
            label={t('settings.version.label', 'Version')}
            description={`${appVersion} (${buildNumber})`}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title={t('settings.sections.dangerZone', 'Danger Zone')}>
          <SettingRow
            icon={ICONS.logout}
            label={t('settings.logout.label', 'Log Out')}
            onPress={handleLogout}
            destructive
          />
          <SettingRow
            icon={ICONS.delete}
            label={t('settings.deleteAccount.label', 'Delete Account')}
            onPress={handleDeleteAccount}
            destructive
          />
        </SettingSection>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.background,
  },
  userInfo: {
    marginLeft: 16,
  },
  username: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.text,
  },
  email: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.text,
  },
  settingDescription: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 2,
  },
  destructiveText: {
    color: COLORS.error,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.textDim,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
