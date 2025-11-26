import { useCallback, useRef } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
    Easing,
    runOnJS,
    cancelAnimation,
} from 'react-native-reanimated';

/**
 * Intensidad del efecto de temblor de pantalla
 */
export type ShakeIntensity = 'light' | 'medium' | 'heavy' | 'critical';

/**
 * Patrones de temblor predefinidos para diferentes situaciones de juego
 */
export type ShakePattern = 'hit' | 'criticalHit' | 'explosion' | 'earthquake' | 'death' | 'levelUp';

interface ShakeConfig {
    intensity: number; // Magnitud del desplazamiento en píxeles
    duration: number; // Duración total en ms
    repetitions: number; // Número de repeticiones
    direction: 'horizontal' | 'vertical' | 'both';
}

const SHAKE_PRESETS: Record<ShakePattern, ShakeConfig> = {
    hit: {
        intensity: 4,
        duration: 200,
        repetitions: 3,
        direction: 'horizontal',
    },
    criticalHit: {
        intensity: 8,
        duration: 350,
        repetitions: 5,
        direction: 'both',
    },
    explosion: {
        intensity: 12,
        duration: 500,
        repetitions: 8,
        direction: 'both',
    },
    earthquake: {
        intensity: 6,
        duration: 1000,
        repetitions: 15,
        direction: 'both',
    },
    death: {
        intensity: 10,
        duration: 600,
        repetitions: 6,
        direction: 'vertical',
    },
    levelUp: {
        intensity: 3,
        duration: 300,
        repetitions: 4,
        direction: 'vertical',
    },
};

const INTENSITY_MULTIPLIERS: Record<ShakeIntensity, number> = {
    light: 0.5,
    medium: 1,
    heavy: 1.5,
    critical: 2,
};

interface UseScreenShakeOptions {
    /**
     * Callback opcional cuando termina el temblor
     */
    onShakeComplete?: () => void;

    /**
     * Si el efecto está habilitado (respeta configuración de usuario)
     */
    enabled?: boolean;
}

interface UseScreenShakeReturn {
    /**
     * Estilo animado para aplicar al contenedor
     */
    shakeStyle: ReturnType<typeof useAnimatedStyle>;

    /**
     * Inicia un temblor con patrón predefinido
     */
    shake: (pattern: ShakePattern, intensity?: ShakeIntensity) => void;

    /**
     * Inicia un temblor con configuración personalizada
     */
    shakeCustom: (config: Partial<ShakeConfig>) => void;

    /**
     * Detiene cualquier temblor en curso
     */
    stopShake: () => void;

    /**
     * Indica si hay un temblor activo
     */
    isShaking: boolean;
}

/**
 * Hook para añadir efectos de temblor de pantalla a contenedores.
 * Usa react-native-reanimated para animaciones de 60fps.
 *
 * @example
 * ```tsx
 * function GameScreen() {
 *   const { shakeStyle, shake } = useScreenShake();
 *
 *   const handleDamage = () => {
 *     shake('hit', 'medium');
 *   };
 *
 *   return (
 *     <Animated.View style={[styles.container, shakeStyle]}>
 *       <GameContent onDamage={handleDamage} />
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useScreenShake(options: UseScreenShakeOptions = {}): UseScreenShakeReturn {
    const { onShakeComplete, enabled = true } = options;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isShakingRef = useRef(false);

    const handleShakeComplete = useCallback(() => {
        isShakingRef.current = false;
        onShakeComplete?.();
    }, [onShakeComplete]);

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    const executeShake = useCallback(
        (config: ShakeConfig) => {
            if (!enabled) return;

            isShakingRef.current = true;

            const singleDuration = config.duration / (config.repetitions * 2);
            const easing = Easing.inOut(Easing.ease);

            // Animación horizontal
            if (config.direction === 'horizontal' || config.direction === 'both') {
                translateX.value = withSequence(
                    // Mover derecha
                    withTiming(config.intensity, { duration: singleDuration, easing }),
                    // Secuencia de ida y vuelta
                    withRepeat(
                        withSequence(
                            withTiming(-config.intensity, { duration: singleDuration * 2, easing }),
                            withTiming(config.intensity, { duration: singleDuration * 2, easing })
                        ),
                        Math.floor(config.repetitions / 2),
                        true
                    ),
                    // Volver al centro
                    withTiming(0, { duration: singleDuration, easing }, (finished) => {
                        if (finished && config.direction !== 'both') {
                            runOnJS(handleShakeComplete)();
                        }
                    })
                );
            }

            // Animación vertical
            if (config.direction === 'vertical' || config.direction === 'both') {
                translateY.value = withSequence(
                    // Mover abajo
                    withTiming(config.intensity * 0.7, { duration: singleDuration, easing }),
                    // Secuencia de ida y vuelta
                    withRepeat(
                        withSequence(
                            withTiming(-config.intensity * 0.7, { duration: singleDuration * 2, easing }),
                            withTiming(config.intensity * 0.7, { duration: singleDuration * 2, easing })
                        ),
                        Math.floor(config.repetitions / 2),
                        true
                    ),
                    // Volver al centro
                    withTiming(0, { duration: singleDuration, easing }, (finished) => {
                        if (finished) {
                            runOnJS(handleShakeComplete)();
                        }
                    })
                );
            }
        },
        [enabled, translateX, translateY, handleShakeComplete]
    );

    const shake = useCallback(
        (pattern: ShakePattern, intensity: ShakeIntensity = 'medium') => {
            const preset = SHAKE_PRESETS[pattern];
            const multiplier = INTENSITY_MULTIPLIERS[intensity];

            executeShake({
                ...preset,
                intensity: preset.intensity * multiplier,
            });
        },
        [executeShake]
    );

    const shakeCustom = useCallback(
        (customConfig: Partial<ShakeConfig>) => {
            const config: ShakeConfig = {
                intensity: customConfig.intensity ?? 5,
                duration: customConfig.duration ?? 300,
                repetitions: customConfig.repetitions ?? 4,
                direction: customConfig.direction ?? 'both',
            };

            executeShake(config);
        },
        [executeShake]
    );

    const stopShake = useCallback(() => {
        cancelAnimation(translateX);
        cancelAnimation(translateY);
        translateX.value = withTiming(0, { duration: 50 });
        translateY.value = withTiming(0, { duration: 50 });
        isShakingRef.current = false;
    }, [translateX, translateY]);

    return {
        shakeStyle,
        shake,
        shakeCustom,
        stopShake,
        isShaking: isShakingRef.current,
    };
}

export default useScreenShake;
