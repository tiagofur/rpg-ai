import { useState, useCallback } from 'react';
import type { DiceType, DiceResult } from '../components/animations/DiceRollAnimation';

interface UseDiceRollReturn {
    /** Current dice result to display */
    result: DiceResult | null;
    /** Whether dice animation is visible */
    isVisible: boolean;
    /** Roll a dice and show animation */
    rollDice: (type: DiceType, modifier?: number) => DiceResult;
    /** Show animation for an existing result */
    showResult: (result: DiceResult) => void;
    /** Hide the dice animation */
    hideDice: () => void;
    /** Called when animation completes */
    onAnimationComplete: () => void;
}

const DICE_MAX: Record<DiceType, number> = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
    d20: 20,
    d100: 100,
};

/**
 * Hook for managing dice roll animations
 *
 * Usage:
 * ```tsx
 * const { result, isVisible, rollDice, onAnimationComplete } = useDiceRoll();
 *
 * // Roll a d20
 * const diceResult = rollDice('d20', 5); // d20+5
 *
 * // In render:
 * <DiceRollAnimation
 *   result={result}
 *   visible={isVisible}
 *   onComplete={onAnimationComplete}
 * />
 * ```
 */
export function useDiceRoll(): UseDiceRollReturn {
    const [result, setResult] = useState<DiceResult | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const rollDice = useCallback((type: DiceType, modifier?: number): DiceResult => {
        const maxValue = DICE_MAX[type];
        const value = Math.floor(Math.random() * maxValue) + 1;

        const diceResult: DiceResult = {
            type,
            value,
            isCritical: type === 'd20' && value === 20,
            isCriticalFail: type === 'd20' && value === 1,
        };

        // Only add modifier if it's a non-zero number
        if (modifier && modifier !== 0) {
            diceResult.modifier = modifier;
        }

        setResult(diceResult);
        setIsVisible(true);

        return diceResult;
    }, []);

    const showResult = useCallback((diceResult: DiceResult) => {
        setResult(diceResult);
        setIsVisible(true);
    }, []);

    const hideDice = useCallback(() => {
        setIsVisible(false);
    }, []);

    const onAnimationComplete = useCallback(() => {
        // Auto-hide after a delay to let user see the result
        setTimeout(() => {
            setIsVisible(false);
        }, 1500);
    }, []);

    return {
        result,
        isVisible,
        rollDice,
        showResult,
        hideDice,
        onAnimationComplete,
    };
}

export default useDiceRoll;
