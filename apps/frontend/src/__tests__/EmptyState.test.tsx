import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      const { toJSON } = render(<EmptyState />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders default variant correctly', () => {
      render(<EmptyState />);

      expect(screen.getByText('📭')).toBeTruthy();
      expect(screen.getByText('Nothing Here')).toBeTruthy();
      expect(screen.getByText('This area is empty.')).toBeTruthy();
    });

    it('renders characters variant correctly', () => {
      render(<EmptyState variant='characters' />);

      expect(screen.getByText('🧙')).toBeTruthy();
      expect(screen.getByText('No Characters Yet')).toBeTruthy();
    });

    it('renders inventory variant correctly', () => {
      render(<EmptyState variant='inventory' />);

      expect(screen.getByText('🎒')).toBeTruthy();
      expect(screen.getByText('Empty Backpack')).toBeTruthy();
    });

    it('renders sessions variant correctly', () => {
      render(<EmptyState variant='sessions' />);

      expect(screen.getByText('📜')).toBeTruthy();
      expect(screen.getByText('No Adventures')).toBeTruthy();
    });

    it('renders quests variant correctly', () => {
      render(<EmptyState variant='quests' />);

      expect(screen.getByText('⚔️')).toBeTruthy();
      expect(screen.getByText('No Active Quests')).toBeTruthy();
    });

    it('renders achievements variant correctly', () => {
      render(<EmptyState variant='achievements' />);

      expect(screen.getByText('🏆')).toBeTruthy();
      expect(screen.getByText('No Achievements')).toBeTruthy();
    });

    it('renders notifications variant correctly', () => {
      render(<EmptyState variant='notifications' />);

      expect(screen.getByText('🔔')).toBeTruthy();
      expect(screen.getByText('All Caught Up!')).toBeTruthy();
    });

    it('renders search variant correctly', () => {
      render(<EmptyState variant='search' />);

      expect(screen.getByText('🔍')).toBeTruthy();
      expect(screen.getByText('No Results')).toBeTruthy();
    });

    it('renders error variant correctly', () => {
      render(<EmptyState variant='error' />);

      expect(screen.getByText('⚠️')).toBeTruthy();
      expect(screen.getByText('Something Went Wrong')).toBeTruthy();
    });

    it('renders offline variant correctly', () => {
      render(<EmptyState variant='offline' />);

      expect(screen.getByText('📡')).toBeTruthy();
      expect(screen.getByText('No Connection')).toBeTruthy();
    });
  });

  describe('customization', () => {
    it('uses custom icon when provided', () => {
      render(<EmptyState icon='🎮' />);

      expect(screen.getByText('🎮')).toBeTruthy();
    });

    it('uses custom title when provided', () => {
      render(<EmptyState title='Custom Title' />);

      expect(screen.getByText('Custom Title')).toBeTruthy();
    });

    it('uses custom description when provided', () => {
      render(<EmptyState description='Custom description text' />);

      expect(screen.getByText('Custom description text')).toBeTruthy();
    });

    it('overrides variant defaults with custom values', () => {
      render(
        <EmptyState
          variant='inventory'
          icon='🎯'
          title='Custom Inventory Title'
          description='Custom inventory description'
        />
      );

      expect(screen.getByText('🎯')).toBeTruthy();
      expect(screen.getByText('Custom Inventory Title')).toBeTruthy();
      expect(screen.getByText('Custom inventory description')).toBeTruthy();
    });
  });

  describe('action button', () => {
    it('does not render action button when no onAction', () => {
      render(<EmptyState actionLabel='Click Me' />);

      expect(screen.queryByText('Click Me')).toBeNull();
    });

    it('does not render action button when no actionLabel', () => {
      const mockOnAction = jest.fn();
      render(<EmptyState onAction={mockOnAction} />);

      // No action button should be rendered
      expect(mockOnAction).not.toHaveBeenCalled();
    });

    it('renders action button when both actionLabel and onAction provided', () => {
      const mockOnAction = jest.fn();
      render(<EmptyState actionLabel='Take Action' onAction={mockOnAction} />);

      expect(screen.getByText('Take Action')).toBeTruthy();
    });

    it('calls onAction when action button is pressed', () => {
      const mockOnAction = jest.fn();
      render(<EmptyState actionLabel='Click Me' onAction={mockOnAction} />);

      fireEvent.press(screen.getByText('Click Me'));

      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { toJSON } = render(<EmptyState size='small' />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders medium size (default)', () => {
      const { toJSON } = render(<EmptyState size='medium' />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders large size', () => {
      const { toJSON } = render(<EmptyState size='large' />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('animation', () => {
    it('renders with animation by default', () => {
      const { toJSON } = render(<EmptyState animated={true} />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders without animation when disabled', () => {
      const { toJSON } = render(<EmptyState animated={false} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('integration scenarios', () => {
    it('works with FlatList ListEmptyComponent pattern', () => {
      // Simulates how it would be used in a FlatList
      render(<EmptyState variant='inventory' actionLabel='Start Exploring' onAction={() => {}} />);

      expect(screen.getByText('Empty Backpack')).toBeTruthy();
      expect(screen.getByText('Start Exploring')).toBeTruthy();
    });

    it('works with search results pattern', () => {
      render(
        <EmptyState
          variant='search'
          description="No items match your search for 'sword'"
          actionLabel='Clear Search'
          onAction={() => {}}
        />
      );

      expect(screen.getByText("No items match your search for 'sword'")).toBeTruthy();
      expect(screen.getByText('Clear Search')).toBeTruthy();
    });

    it('works with error pattern', () => {
      const mockRetry = jest.fn();
      render(<EmptyState variant='error' actionLabel='Retry' onAction={mockRetry} />);

      fireEvent.press(screen.getByText('Retry'));
      expect(mockRetry).toHaveBeenCalled();
    });
  });
});
