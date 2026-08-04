import { useEffect, useState } from 'react';

/**
 * Tracks how many pixels of the layout viewport are currently covered by the
 * on-screen keyboard.
 *
 * The app's viewport meta has no `interactive-widget` override, so mobile
 * browsers use the default `resizes-visual` behaviour: the layout viewport
 * (and therefore `100dvh`) stays the same size while the keyboard is open and
 * only `visualViewport` shrinks. That means absolutely positioned bottom
 * elements would sit *behind* the keyboard unless we offset them ourselves.
 *
 * Returns 0 when no keyboard is present.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const overlap = window.innerHeight - (vv.height + vv.offsetTop);
        // Ignore small deltas caused by collapsing browser chrome / rounding.
        setInset(overlap > 60 ? Math.round(overlap) : 0);
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
