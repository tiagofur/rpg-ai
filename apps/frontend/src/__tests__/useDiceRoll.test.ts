import { renderHook, act } from '@testing-library/react-native';
import { useDiceRoll } from '../hooks/useDiceRoll';
import type { DiceResult } from '../components/animations/DiceRollAnimation';

describe('useDiceRoll', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('initialization', () => {
        it('should start with no result and not visible', () => {
            const { result } = renderHook(() => useDiceRoll());

            expect(result.current.result).toBeNull();
            expect(result.current.isVisible).toBe(false);
        });
    });

    describe('rollDice', () => {
        it('should roll a d20 and return result', () => {
            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d20');
            });

            expect(diceResult).toBeDefined();
            expect(diceResult?.type).toBe('d20');
            expect(diceResult?.value).toBeGreaterThanOrEqual(1);
            expect(diceResult?.value).toBeLessThanOrEqual(20);
            expect(result.current.isVisible).toBe(true);
        });

        it('should roll a d6 within valid range', () => {
            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d6');
            });

            expect(diceResult?.type).toBe('d6');
            expect(diceResult?.value).toBeGreaterThanOrEqual(1);
            expect(diceResult?.value).toBeLessThanOrEqual(6);
        });

        it('should include modifier when provided', () => {
            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d20', 5);
            });

            expect(diceResult?.modifier).toBe(5);
        });

        it('should not include modifier when zero', () => {
            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d20', 0);
            });

            expect(diceResult?.modifier).toBeUndefined();
        });

        it('should set isCritical for d20 rolling 20', () => {
            // Mock Math.random to return max value (will result in 20)
            jest.spyOn(Math, 'random').mockReturnValue(0.999999);

            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d20');
            });

            expect(diceResult?.value).toBe(20);
            expect(diceResult?.isCritical).toBe(true);
            expect(diceResult?.isCriticalFail).toBe(false);

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should set isCriticalFail for d20 rolling 1', () => {
            // Mock Math.random to return 0 (will result in 1)
            jest.spyOn(Math, 'random').mockReturnValue(0);

            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d20');
            });

            expect(diceResult?.value).toBe(1);
            expect(diceResult?.isCritical).toBe(false);
            expect(diceResult?.isCriticalFail).toBe(true);

            jest.spyOn(Math, 'random').mockRestore();
        });

        it('should not set critical flags for non-d20 dice', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.999999);

            const { result } = renderHook(() => useDiceRoll());

            let diceResult: DiceResult | undefined;
            act(() => {
                diceResult = result.current.rollDice('d6');
            });

            expect(diceResult?.value).toBe(6);
            expect(diceResult?.isCritical).toBe(false);
            expect(diceResult?.isCriticalFail).toBe(false);

            jest.spyOn(Math, 'random').mockRestore();
        });
    });

    describe('showResult', () => {
        it('should show a custom result', () => {
            const { result } = renderHook(() => useDiceRoll());

            const customResult: DiceResult = {
                type: 'd20',
                value: 15,
                modifier: 3,
                isCritical: false,
                isCriticalFail: false,
            };

            act(() => {
                result.current.showResult(customResult);
            });

            expect(result.current.result).toEqual(customResult);
            expect(result.current.isVisible).toBe(true);
        });
    });

    describe('hideDice', () => {
        it('should hide the dice animation', () => {
            const { result } = renderHook(() => useDiceRoll());

            act(() => {
                result.current.rollDice('d20');
            });
            expect(result.current.isVisible).toBe(true);

            act(() => {
                result.current.hideDice();
            });
            expect(result.current.isVisible).toBe(false);
        });
    });

    describe('onAnimationComplete', () => {
        it('should auto-hide after delay', () => {
            const { result } = renderHook(() => useDiceRoll());

            act(() => {
                result.current.rollDice('d20');
            });
            expect(result.current.isVisible).toBe(true);

            act(() => {
                result.current.onAnimationComplete();
            });
            // Still visible immediately
            expect(result.current.isVisible).toBe(true);

            // After delay, should hide
            act(() => {
                jest.advanceTimersByTime(1500);
            });
            expect(result.current.isVisible).toBe(false);
        });
    });

    describe('all dice types', () => {
        const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;

        diceTypes.forEach((diceType) => {
            it(`should roll ${diceType} correctly`, () => {
                const { result } = renderHook(() => useDiceRoll());

                let diceResult: DiceResult | undefined;
                act(() => {
                    diceResult = result.current.rollDice(diceType);
                });

                const maxValue = parseInt(diceType.slice(1), 10);
                expect(diceResult?.type).toBe(diceType);
                expect(diceResult?.value).toBeGreaterThanOrEqual(1);
                expect(diceResult?.value).toBeLessThanOrEqual(maxValue);
            });
        });
    });
});
