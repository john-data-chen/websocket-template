import { useIsMobileScreen } from '@/hooks/useIsMobileScreen';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useIsMobileScreen', () => {
  // Mock window.innerWidth and window.addEventListener
  const originalInnerWidth = window.innerWidth;
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  let eventHandlers: Record<string, EventListener> = {};

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024 // Default to desktop size
    });

    // Mock window.addEventListener
    window.addEventListener = vi.fn((event, handler) => {
      if (typeof handler === 'function') {
        eventHandlers[event] = handler as EventListener;
      }
    });

    // Mock window.removeEventListener
    window.removeEventListener = vi.fn((event) => {
      delete eventHandlers[event];
    });
  });

  afterEach(() => {
    // Restore original implementations
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth
    });
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    eventHandlers = {};
    vi.clearAllMocks();
  });

  const triggerResize = (width: number) => {
    // Update innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: width
    });

    // Trigger the stored resize handler directly
    act(() => {
      const resizeHandler = eventHandlers['resize'];
      if (resizeHandler) {
        resizeHandler(new Event('resize'));
      }
    });
  };

  it('should return false for desktop screens by default', async () => {
    const { result } = renderHook(() => useIsMobileScreen());

    await vi.waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should return true for mobile screens', async () => {
    // Set initial width to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 500 // Mobile width
    });

    const { result } = renderHook(() => useIsMobileScreen());

    await vi.waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should update when window is resized to mobile', async () => {
    const { result } = renderHook(() => useIsMobileScreen());

    // Initial state (desktop)
    expect(result.current).toBe(false);

    // Resize to mobile
    triggerResize(500);

    // Should now be mobile
    await vi.waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should update when window is resized to desktop', async () => {
    // Start with mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 500 // Mobile width
    });

    const { result } = renderHook(() => useIsMobileScreen());

    // Initial state (mobile)
    expect(result.current).toBe(true);

    // Resize to desktop
    triggerResize(1024);

    // Should now be desktop
    await vi.waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should clean up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useIsMobileScreen());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });
});
