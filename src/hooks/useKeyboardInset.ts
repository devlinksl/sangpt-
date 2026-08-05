import { useEffect, useState } from 'react';

/**
 * Locks the chat shell to a *frozen* full-screen height and reports how many
 * pixels of that frozen area the on-screen keyboard currently covers.
 *
 * Why a frozen height instead of `100dvh`:
 *   - In Chrome/Android `100dvh` follows the *layout* viewport, which normally
 *     does not shrink for the keyboard — but in a Capacitor Android WebView
 *     (`adjustResize`, the default) the whole window is resized, so `dvh`
 *     *does* shrink and the entire page reflows upward. Same for `h-full` on
 *     fixed elements.
 *   - By measuring the tallest viewport height we've ever seen (per
 *     orientation) once, writing it to `--san-shell-h`, and never lowering it
 *     for a keyboard-sized shrink, the shell keeps its full-screen height. The
 *     keyboard then simply overlays it, and only the floating composer moves,
 *     driven by the returned inset.
 *
 * Returns 0 when no keyboard is present.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    // The tallest height seen for the current orientation = "no keyboard" height.
    let baseline = Math.max(window.innerHeight, vv?.height ?? 0);
    let baselineIsPortrait = window.innerHeight >= window.innerWidth;

    const applyBaseline = () => {
      root.style.setProperty('--san-shell-h', `${Math.round(baseline)}px`);
    };
    applyBaseline();

    // Undo any browser-initiated scroll of the app shell.
    const resetShellScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
      if (root.scrollTop !== 0) root.scrollTop = 0;
      if (document.body.scrollTop !== 0) document.body.scrollTop = 0;
    };

    const measure = () => {
      const isPortrait = window.innerHeight >= window.innerWidth;
      const current = vv ? vv.height : window.innerHeight;

      // Orientation flip → start a fresh baseline from the current geometry.
      if (isPortrait !== baselineIsPortrait) {
        baselineIsPortrait = isPortrait;
        baseline = Math.max(window.innerHeight, current);
        applyBaseline();
      } else if (current > baseline || window.innerHeight > baseline) {
        // Viewport genuinely grew (keyboard closed, chrome collapsed, resize).
        baseline = Math.max(window.innerHeight, current);
        applyBaseline();
      }

      // Keyboard height = frozen shell height minus the currently visible area.
      // offsetTop is the browser shifting the visual viewport (page
      // displacement), so it is subtracted out rather than added.
      const overlap = baseline - current - (vv?.offsetTop ?? 0);
      resetShellScroll();
      setInset(overlap > 60 ? Math.round(overlap) : 0);
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // Browsers scroll the page on focus *after* the focus event fires, so keep
    // snapping back for a few frames rather than only once.
    const onFocusIn = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !t.isContentEditable) return;
      let ticks = 0;
      const snap = () => {
        resetShellScroll();
        if (++ticks < 14) requestAnimationFrame(snap);
      };
      snap();
    };

    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('scroll', resetShellScroll, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    vv?.addEventListener('resize', schedule);
    vv?.addEventListener('scroll', schedule);

    measure();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('scroll', resetShellScroll);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      vv?.removeEventListener('resize', schedule);
      vv?.removeEventListener('scroll', schedule);
      root.style.removeProperty('--san-shell-h');
    };
  }, []);

  return inset;
}
