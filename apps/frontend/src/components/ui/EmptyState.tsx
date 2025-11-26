import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../theme';

/**
 * Variantes de estados vacíos para diferentes contextos
 */
export type EmptyStateVariant =
  | 'characters'
  | 'sessions'
  | 'inventory'
  | 'quests'
  | 'achievements'
  | 'notifications'
  | 'search'
  | 'error'
  | 'offline'
  | 'default';

interface EmptyStateProps {
  /**
   * Variante predefinida que determina icono, título y descripción por defecto
   */
  variant?: EmptyStateVariant;

  /**
   * Icono personalizado (emoji o texto)
   */
  icon?: string;

  /**
   * Título personalizado
   */
  title?: string;

  /**
   * Descripción personalizada
   */
  description?: string;

  /**
   * Texto del botón de acción
   */
  actionLabel?: string;

  /**
   * Callback cuando se presiona el botón de acción
   */
  onAction?: () => void;

  /**
   * Tamaño del estado vacío
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Si debe tener animación de entrada
   */
  animated?: boolean;
}

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  { icon: string; title: string; description: string }
> = {
  characters: {
    icon: '🧙',
    title: 'No Characters Yet',
    description: 'Create your first hero and begin your epic adventure!',
  },
  sessions: {
    icon: '📜',
    title: 'No Adventures',
    description: 'Start a new game session to begin your journey.',
  },
  inventory: {
    icon: '🎒',
    title: 'Empty Backpack',
    description: 'Your inventory is empty. Explore and collect items!',
  },
  quests: {
    icon: '⚔️',
    title: 'No Active Quests',
    description: 'Speak with NPCs to discover new quests and challenges.',
  },
  achievements: {
    icon: '🏆',
    title: 'No Achievements',
    description: 'Complete challenges to earn achievements and rewards.',
  },
  notifications: {
    icon: '🔔',
    title: 'All Caught Up!',
    description: 'You have no new notifications.',
  },
  search: {
    icon: '🔍',
    title: 'No Results',
    description: 'Try a different search term or filter.',
  },
  error: {
    icon: '⚠️',
    title: 'Something Went Wrong',
    description: 'An error occurred. Please try again later.',
  },
  offline: {
    icon: '📡',
    title: 'No Connection',
    description: 'Check your internet connection and try again.',
  },
  default: {
    icon: '📭',
    title: 'Nothing Here',
    description: 'This area is empty.',
  },
};

/**
 * Componente EmptyState reutilizable para mostrar estados vacíos
 * con diseño consistente en toda la aplicación.
 *
 * @example
 * ```tsx
 * // Usando variante predefinida
 * <EmptyState variant="inventory" />
 *
 * // Con acción personalizada
 * <EmptyState
 *   variant="characters"
 *   actionLabel="Create Character"
 *   onAction={() => navigation.navigate('CreateCharacter')}
 * />
 *
 * // Completamente personalizado
 * <EmptyState
 *   icon="🎮"
 *   title="Custom Title"
 *   description="Custom description text"
 *   actionLabel="Do Something"
 *   onAction={handleAction}
 * />
 * ```
 */
export function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'medium',
  animated = true,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];

  const displayIcon = icon ?? config.icon;
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;

  const sizeStyles = {
    small: {
      iconSize: 40,
      titleSize: 14,
      descriptionSize: 12,
      padding: 16,
    },
    medium: {
      iconSize: 64,
      titleSize: 18,
      descriptionSize: 14,
      padding: 24,
    },
    large: {
      iconSize: 80,
      titleSize: 22,
      descriptionSize: 16,
      padding: 32,
    },
  };

  const currentSize = sizeStyles[size];

  const content = (
    <View style={[styles.container, { padding: currentSize.padding }]}>
      <View
        style={[
          styles.iconContainer,
          { width: currentSize.iconSize * 1.5, height: currentSize.iconSize * 1.5 },
        ]}
      >
        <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>{displayIcon}</Text>
      </View>

      <Text style={[styles.title, { fontSize: currentSize.titleSize }]}>{displayTitle}</Text>

      <Text style={[styles.description, { fontSize: currentSize.descriptionSize }]}>
        {displayDescription}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <LinearGradient
            colors={[COLORS.primary, '#c9a227']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <Animated.View entering={ZoomIn.delay(200).springify()}>{content}</Animated.View>
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(247, 207, 70, 0.1)',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(247, 207, 70, 0.2)',
  },
  icon: {
    // fontSize set dynamically
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: COLORS.textDim,
    fontFamily: FONTS.body,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  actionText: {
    color: '#000',
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EmptyState;
