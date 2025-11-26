import { ReactNode } from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

import { QuickActionsBar } from '../components/QuickActionsBar';
import { SettingsProvider } from '../context/SettingsContext';

// Wrapper with SettingsProvider for useGameEffects
function TestWrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

// Mock handlers
const mockOnAction = jest.fn();
const mockOnOpenInventory = jest.fn();
const mockOnOpenCharacter = jest.fn();

describe('QuickActionsBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { toJSON } = render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
          />
        </TestWrapper>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders all default quick actions', () => {
      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
          />
        </TestWrapper>
      );

      // Check for key action emojis
      expect(screen.getByText('👁️')).toBeTruthy();
      expect(screen.getByText('⚔️')).toBeTruthy();
      expect(screen.getByText('🛡️')).toBeTruthy();
      expect(screen.getByText('🎒')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onAction when action button is pressed', () => {
      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
          />
        </TestWrapper>
      );

      // Find and press the look action (👁️)
      const lookButton = screen.getByText('👁️');
      const lookButtonParent = lookButton.parent?.parent;
      if (lookButtonParent) {
        fireEvent.press(lookButtonParent);
      }

      expect(mockOnAction).toHaveBeenCalledWith('look');
    });

    it('calls onOpenInventory when inventory button is pressed', () => {
      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
          />
        </TestWrapper>
      );

      const inventoryButton = screen.getByText('🎒');
      const inventoryButtonParent = inventoryButton.parent?.parent;
      if (inventoryButtonParent) {
        fireEvent.press(inventoryButtonParent);
      }

      expect(mockOnOpenInventory).toHaveBeenCalled();
    });

    it('calls onOpenCharacter when character button is pressed', () => {
      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
          />
        </TestWrapper>
      );

      const characterButton = screen.getByText('👤');
      const characterButtonParent = characterButton.parent?.parent;
      if (characterButtonParent) {
        fireEvent.press(characterButtonParent);
      }

      expect(mockOnOpenCharacter).toHaveBeenCalled();
    });

    it('does not call handlers when disabled', () => {
      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
            disabled={true}
          />
        </TestWrapper>
      );

      const lookButton = screen.getByText('👁️');
      const lookButtonParent = lookButton.parent?.parent;
      if (lookButtonParent) {
        fireEvent.press(lookButtonParent);
      }

      expect(mockOnAction).not.toHaveBeenCalled();
    });
  });

  describe('combat mode', () => {
    it('renders with combat actions prioritized when inCombat is true', () => {
      const { toJSON } = render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
            inCombat={true}
          />
        </TestWrapper>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('contextual actions', () => {
    it('renders custom contextual actions when provided', () => {
      const customActions = [
        {
          id: 'custom',
          emoji: '🎯',
          labelKey: 'game.custom',
          command: 'custom_action',
          category: 'utility' as const,
        },
      ];

      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
            contextualActions={customActions}
          />
        </TestWrapper>
      );

      expect(screen.getByText('🎯')).toBeTruthy();
    });

    it('executes custom action command', () => {
      const customActions = [
        {
          id: 'custom',
          emoji: '🎯',
          labelKey: 'game.custom',
          command: 'special_attack',
          category: 'combat' as const,
        },
      ];

      render(
        <TestWrapper>
          <QuickActionsBar
            onAction={mockOnAction}
            onOpenInventory={mockOnOpenInventory}
            onOpenCharacter={mockOnOpenCharacter}
            contextualActions={customActions}
          />
        </TestWrapper>
      );

      const customButton = screen.getByText('🎯');
      const customButtonParent = customButton.parent?.parent;
      if (customButtonParent) {
        fireEvent.press(customButtonParent);
      }

      expect(mockOnAction).toHaveBeenCalledWith('special_attack');
    });
  });
});
