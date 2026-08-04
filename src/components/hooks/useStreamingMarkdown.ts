import { useEffect, useRef, useState } from 'react';

interface Options {
  enabled?: boolean;
  fps?: number;
  batchMs?: number;
}

/**
 * Smoothly reveals incoming content instead of jumping in large chunks.
 */
export const useStreamingMarkdown = (
  content: string,
  { enabled = true, fps = 30 }: Options = {}
) => {
  const [visible, setVisible] = useState(enabled ? '' : content);
  const targetRef = useRef(content);
  const frameRef = useRef<number | null>(null);

  targetRef.current = content;

  useEffect(() => {
    if (!enabled) {
      setVisible(content);
      return;
    }

    const interval = Math.max(16, Math.round(1000 / Math.max(1, fps)));
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      setVisible((prev) => {
        const target = targetRef.current;
        if (prev === target) return prev;
        if (!target.startsWith(prev)) return target;

        const remaining = target.length - prev.length;
        const step = Math.max(2, Math.ceil(remaining / 6));
        return target.slice(0, prev.length + step);
      });

      frameRef.current = window.setTimeout(tick, interval) as unknown as number;
    };

    tick();

    return () => {
      cancelled = true;
      if (frameRef.current) clearTimeout(frameRef.current);
    };
  }, [enabled, fps, content]);

  return enabled ? visible : content;
};
