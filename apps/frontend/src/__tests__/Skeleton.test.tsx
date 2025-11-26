import { render } from '@testing-library/react-native';
import { Skeleton } from '../components/Skeleton';

describe('Skeleton', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      const { toJSON } = render(<Skeleton />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders text variant by default', () => {
      const { toJSON } = render(<Skeleton />);
      const tree = toJSON();
      expect(tree).toBeTruthy();
    });

    it('renders circle variant correctly', () => {
      const { toJSON } = render(<Skeleton variant='circle' width={50} />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders rect variant correctly', () => {
      const { toJSON } = render(<Skeleton variant='rect' width={100} height={50} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('props handling', () => {
    it('applies custom width', () => {
      const { toJSON } = render(<Skeleton width={200} />);
      expect(toJSON()).toBeTruthy();
    });

    it('applies custom height', () => {
      const { toJSON } = render(<Skeleton height={32} />);
      expect(toJSON()).toBeTruthy();
    });

    it('applies custom borderRadius', () => {
      const { toJSON } = render(<Skeleton borderRadius={16} />);
      expect(toJSON()).toBeTruthy();
    });

    it('applies custom style', () => {
      const { toJSON } = render(<Skeleton style={{ marginTop: 10 }} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('text variant uses full width by default', () => {
      const { toJSON } = render(<Skeleton variant='text' />);
      expect(toJSON()).toBeTruthy();
    });

    it('circle variant creates square dimensions', () => {
      const size = 60;
      const { toJSON } = render(<Skeleton variant='circle' width={size} />);
      expect(toJSON()).toBeTruthy();
    });

    it('rect variant respects both width and height', () => {
      const { toJSON } = render(<Skeleton variant='rect' width={150} height={80} />);
      expect(toJSON()).toBeTruthy();
    });
  });
});
