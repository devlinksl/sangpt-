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
 * It also means the browser will happily scroll/offset the page to reveal the
 * focused field, which drags the app chrome (header, sidebar toggle) above the
 * status bar. So we also snap the document back to 0 whenever that happens —
 * the shell must never move, only the composer, which we lift with the
 * returned inset.
 *
 * Returns 0 when no keyboard is present.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;

    // Undo any browser-initiated scroll of the app shell.
    const resetShellScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
      if (document.documentElement.scrollTop !== 0) document.documentElement.scrollTop = 0;
      if (document.body.scrollTop !== 0) document.body.scrollTop = 0;
    };

    // Browsers scroll the page on focus *after* the focus event fires, so keep
    // snapping back for a few frames rather than only once.
    const onFocusIn = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !t.isContentEditable) return;
      resetShellScroll();
      let ticks = 0;
      const snap = () => {
        resetShellScroll();
        if (++ticks < 14) requestAnimationFrame(snap);
      };
      requestAnimationFrame(snap);
    };

    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('scroll', resetShellScroll, { passive: true });

    const removeShellListeners = () => {
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('scroll', resetShellScroll);
    };

    if (!vv) return removeShellListeners;

    let frame = 0;

    const update = () => {
      resetShellScroll();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // offsetTop is the browser shifting the visual viewport inside the
        // layout viewport — that is page displacement, not keyboard height, so
        // it must not add to the inset.
        const overlap = window.innerHeight - vv.height - vv.offsetTop;
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
      removeShellListeners();
    };
  }, []);

  return inset;
}
