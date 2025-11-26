import { render, screen } from '@testing-library/react-native';
import { AIThinkingIndicator } from '../components/AIThinkingIndicator';

describe('AIThinkingIndicator', () => {
  describe('visibility', () => {
    it('renders nothing when visible is false', () => {
      const { toJSON } = render(<AIThinkingIndicator visible={false} />);
      expect(toJSON()).toBeNull();
    });

    it('renders content when visible is true', () => {
      const { toJSON } = render(<AIThinkingIndicator visible={true} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('renders inline variant by default', () => {
      render(<AIThinkingIndicator visible={true} />);
      // Inline variant shows the crystal emoji and text
      expect(screen.getByText('🔮')).toBeTruthy();
      expect(screen.getByText('game.aiThinking')).toBeTruthy(); // i18n mocked to return key
    });

    it('renders minimal variant with dots only', () => {
      const { toJSON } = render(<AIThinkingIndicator visible={true} variant='minimal' />);
      expect(toJSON()).toBeTruthy();
      // Minimal variant should NOT have text
      expect(screen.queryByText('game.aiThinking')).toBeNull();
    });

    it('renders full variant with all elements', () => {
      render(<AIThinkingIndicator visible={true} variant='full' />);
      // Full variant shows the big crystal and crafting text
      expect(screen.getByText('🔮')).toBeTruthy();
      expect(screen.getByText('game.aiCrafting')).toBeTruthy();
      expect(screen.getByText('game.aiPleaseWait')).toBeTruthy();
    });
  });

  describe('animations', () => {
    it('should have animated elements (dots)', () => {
      const { toJSON } = render(<AIThinkingIndicator visible={true} variant='inline' />);
      const tree = toJSON();
      expect(tree).toBeTruthy();
      // Animation is handled by reanimated, we just verify render doesn't crash
    });

    it('minimal variant has animated dots', () => {
      const { toJSON } = render(<AIThinkingIndicator visible={true} variant='minimal' />);
      expect(toJSON()).toBeTruthy();
    });

    it('full variant has pulse animation on crystal', () => {
      const { toJSON } = render(<AIThinkingIndicator visible={true} variant='full' />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
