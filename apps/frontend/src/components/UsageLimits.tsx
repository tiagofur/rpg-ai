import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, theme } from '../theme';

export interface UsageLimitData {
  feature: string;
  current: number;
  limit: number;
  icon: string;
}

interface UsageLimitsProps {
  limits: UsageLimitData[];
  plan: 'free' | 'basic' | 'premium' | 'supreme';
  onUpgrade?: () => void;
  compact?: boolean;
}

const getPlanName = (planType: string) => {
  switch (planType) {
    case 'supreme':
      return 'Supreme';
    case 'premium':
      return 'Premium';
    case 'basic':
      return 'Basic';
    default:
      return 'Free';
  }
};

const isUnlimited = (limit: number) => limit === -1;

const getPercentage = (current: number, limit: number) => {
  if (isUnlimited(limit)) return 0;
  if (limit === 0) return 100;
  return Math.min((current / limit) * 100, 100);
};

const isNearLimit = (current: number, limit: number) => {
  if (isUnlimited(limit)) return false;
  return getPercentage(current, limit) >= 80;
};

export function UsageLimits({ limits, plan, onUpgrade, compact = false }: UsageLimitsProps) {
  const { t } = useTranslation();

  const getPlanColor = (planType: string): [string, string] => {
    switch (planType) {
      case 'supreme':
        return ['#b366ff', '#8b3dff'];
      case 'premium':
        return [theme.colors.gold, theme.colors.goldDark];
      case 'basic':
        return ['#4d79ff', '#3d5fcc'];
      default:
        return ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'];
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <LinearGradient colors={getPlanColor(plan)} style={styles.compactPlanBadge}>
          <Text style={styles.compactPlanText}>{getPlanName(plan)}</Text>
        </LinearGradient>
        {limits.slice(0, 2).map((limit, index) => {
          const percentage = getPercentage(limit.current, limit.limit);
          const nearLimit = isNearLimit(limit.current, limit.limit);
          const unlimited = isUnlimited(limit.limit);

          return (
            <View key={index} style={styles.compactLimitItem}>
              <Text style={styles.compactIcon}>{limit.icon}</Text>
              <Text style={[styles.compactText, nearLimit && styles.warningText]}>
                {unlimited ? `${limit.current} (∞)` : `${limit.current}/${limit.limit}`}
              </Text>
              {!unlimited && (
                <View style={styles.compactBar}>
                  <View
                    style={[
                      styles.compactBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: nearLimit ? theme.colors.warning : theme.colors.gold,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Plan Badge */}
      <LinearGradient
        colors={getPlanColor(plan)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.planBadge}
      >
        <Text style={styles.planName}>
          {getPlanName(plan)} {t('subscription.tier')}
        </Text>
        {plan === 'free' && onUpgrade && (
          <TouchableOpacity style={styles.upgradeButtonSmall} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonSmallText}>↑</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Usage Bars */}
      <View style={styles.limitsContainer}>
        {limits.map((limit, index) => {
          const percentage = getPercentage(limit.current, limit.limit);
          const nearLimit = isNearLimit(limit.current, limit.limit);
          const unlimited = isUnlimited(limit.limit);

          return (
            <View key={index} style={styles.limitItem}>
              <View style={styles.limitHeader}>
                <View style={styles.limitTitleRow}>
                  <Text style={styles.limitIcon}>{limit.icon}</Text>
                  <Text style={styles.limitName}>{limit.feature}</Text>
                </View>
                <Text
                  style={[
                    styles.limitValue,
                    nearLimit && styles.warningText,
                    unlimited && styles.unlimitedText,
                  ]}
                >
                  {unlimited ? `${limit.current} (∞)` : `${limit.current} / ${limit.limit}`}
                </Text>
              </View>

              {!unlimited && (
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={
                      nearLimit
                        ? [theme.colors.warning, theme.colors.danger]
                        : [theme.colors.gold, theme.colors.goldDark]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${percentage}%` }]}
                  />
                </View>
              )}

              {nearLimit && !unlimited && (
                <Text style={styles.warningMessage}>⚠️ {t('usage.nearLimit')}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Upgrade Button */}
      {plan === 'free' && onUpgrade && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <LinearGradient
            colors={[theme.colors.gold, theme.colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeButtonGradient}
          >
            <Text style={styles.upgradeButtonText}>⭐ {t('subscription.upgrade')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  planName: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.background,
  },
  upgradeButtonSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonSmallText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  limitsContainer: {
    gap: 12,
  },
  limitItem: {
    gap: 6,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitIcon: {
    fontSize: 16,
  },
  limitName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
  },
  limitValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  warningText: {
    color: theme.colors.warning,
  },
  unlimitedText: {
    color: theme.colors.gold,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  warningMessage: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: theme.colors.warning,
    marginTop: 2,
  },
  upgradeButton: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.background,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactPlanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactPlanText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.background,
  },
  compactLimitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactIcon: {
    fontSize: 12,
  },
  compactText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.text,
    minWidth: 50,
  },
  compactBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
