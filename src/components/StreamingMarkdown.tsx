import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from 'react';

import { MarkdownRenderer } from './MarkdownRenderer';
import { StreamingCursor } from './StreamingCursor';
import { TOC } from './TOC';

import { useStreamingMarkdown } from './hooks/useStreamingMarkdown';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useDebouncedContent } from './hooks/useDebouncedContent';

import { splitMarkdownBlocks } from './utils/splitMarkdownBlocks';

import { LinkConfirmModal } from './LinkConfirmModal';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;

  /**
   * Typography / UX
   */
  className?: string;
  enableTOC?: boolean;
  enableReadingTime?: boolean;
  enableSmartStreaming?: boolean;
  enableAutoScroll?: boolean;

  /**
   * Code blocks
   */
  showLineNumbers?: boolean;
  collapsibleCode?: boolean;

  /**
   * Tables
   */
  sortableTables?: boolean;

  /**
   * Headings
   */
  autoNumberHeadings?: boolean;

  /**
   * Streaming tuning
   */
  streamFPS?: number;
  streamBatchMs?: number;
}

const STREAM_ANNOUNCE_INTERVAL = 1500;

export const StreamingMarkdown = memo(
  ({
    content,
    isStreaming = false,

    className,

    enableTOC = false,
    enableReadingTime = false,
    enableSmartStreaming = true,
    enableAutoScroll = true,

    showLineNumbers = true,
    collapsibleCode = true,

    sortableTables = false,

    autoNumberHeadings = false,

    streamFPS = 30,
    streamBatchMs = 50,
  }: StreamingMarkdownProps) => {
    /**
     * =========================================================
     * Accessibility / Motion
     * =========================================================
     */

    const prefersReducedMotion = useReducedMotion();

    /**
     * =========================================================
     * Streaming
     * =========================================================
     */

    const streamedContent = useStreamingMarkdown(content, {
      enabled: enableSmartStreaming,
      fps: streamFPS,
      batchMs: streamBatchMs,
    });

    /**
     * Debounced markdown parsing
     * Prevents reparsing entire AST on every tiny update
     */

    const debouncedContent = useDebouncedContent(
      streamedContent,
      isStreaming ? 80 : 0
    );

    /**
     * =========================================================
     * Stable block splitting
     * =========================================================
     */

    const blocks = useMemo(() => {
      return splitMarkdownBlocks(debouncedContent);
    }, [debouncedContent]);

    /**
     * =========================================================
     * Reading time
     * =========================================================
     */

    const readingTime = useMemo(() => {
      if (!enableReadingTime) return null;

      const words = debouncedContent.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(words / 220));

      return `${minutes} min read`;
    }, [debouncedContent, enableReadingTime]);

    /**
     * =========================================================
     * Link confirmation
     * =========================================================
     */

    const [linkToOpen, setLinkToOpen] = useState<string | null>(null);

    const handleLinkClick = (url: string) => {
      setLinkToOpen(url);
    };

    const confirmOpenLink = () => {
      if (!linkToOpen) return;

      window.open(linkToOpen, '_blank', 'noopener,noreferrer');
      setLinkToOpen(null);
    };

    /**
     * =========================================================
     * Streaming completion flash
     * =========================================================
     */

    const [didComplete, setDidComplete] = useState(false);

    const previousStreamingRef = useRef(isStreaming);

    useEffect(() => {
      const wasStreaming = previousStreamingRef.current;

      if (wasStreaming && !isStreaming) {
        setDidComplete(true);

        const timeout = setTimeout(() => {
          setDidComplete(false);
        }, 1200);

        return () => clearTimeout(timeout);
      }

      previousStreamingRef.current = isStreaming;
    }, [isStreaming]);

    /**
     * =========================================================
     * Auto-scroll preservation
     * =========================================================
     */

    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!enableAutoScroll) return;

      const el = containerRef.current;
      if (!el) return;

      requestAnimationFrame(() => {
        el.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'end',
        });
      });
    }, [blocks, enableAutoScroll, prefersReducedMotion]);

    /**
     * =========================================================
     * Screen reader announcements
     * =========================================================
     */

    const [announceText, setAnnounceText] = useState('');

    useEffect(() => {
      if (!isStreaming) {
        setAnnounceText('Response complete');
        return;
      }

      const interval = setInterval(() => {
        setAnnounceText('Assistant is generating a response');
      }, STREAM_ANNOUNCE_INTERVAL);

      return () => clearInterval(interval);
    }, [isStreaming]);

    /**
     * =========================================================
     * TOC headings extraction
     * =========================================================
     */

    const headings = useMemo(() => {
      if (!enableTOC) return [];

      return blocks
        .filter((block: any) => block.type === 'heading')
        .map((block: any) => ({
          id: block.id,
          depth: block.depth,
          text: block.text,
        }));
    }, [blocks, enableTOC]);

    /**
     * =========================================================
     * Render
     * =========================================================
     */

    return (
      <>
        {/* Screen reader live region */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announceText}
        </div>

        <div
          ref={containerRef}
          className={[
            'relative w-full',
            didComplete &&
              !prefersReducedMotion &&
              'animate-in fade-in duration-500',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* ================================================= */}
          {/* Header */}
          {/* ================================================= */}

          {(enableTOC || readingTime) && (
            <div className="mb-6 flex flex-col gap-4">
              {readingTime && (
                <div className="text-xs text-muted-foreground">
                  {readingTime}
                </div>
              )}

              {enableTOC && headings.length > 0 && (
                <Suspense fallback={null}>
                  <TOC headings={headings} />
                </Suspense>
              )}
            </div>
          )}

          {/* ================================================= */}
          {/* Main prose container */}
          {/* ================================================= */}

          <div
            className={[
              'prose prose-neutral dark:prose-invert',
              'max-w-none',
              'prose-headings:scroll-mt-24',
              'prose-pre:p-0',
              'prose-pre:bg-transparent',
              'prose-code:before:hidden',
              'prose-code:after:hidden',
              'prose-img:my-6',
              'prose-table:block',
              'prose-table:w-full',
              'prose-th:border-border',
              'prose-td:border-border',
              'prose-hr:border-border',
              'selection:bg-primary/20',
            ].join(' ')}
          >
            {/* ================================================= */}
            {/* Block-level memoized rendering */}
            {/* ================================================= */}

            {blocks.map((block: any) => (
              <MemoizedMarkdownBlock
                key={block.id}
                block={block}
                isStreaming={isStreaming}
                onLinkClick={handleLinkClick}
                showLineNumbers={showLineNumbers}
                collapsibleCode={collapsibleCode}
                sortableTables={sortableTables}
                autoNumberHeadings={autoNumberHeadings}
              />
            ))}

            {/* ================================================= */}
            {/* Streaming cursor */}
            {/* ================================================= */}

            {isStreaming && (
              <div
                className="inline-flex items-center"
                aria-label="Assistant is typing"
              >
                <StreamingCursor />
              </div>
            )}
          </div>
        </div>

        {/* ===================================================== */}
        {/* Link confirm modal */}
        {/* ===================================================== */}

        <LinkConfirmModal
          isOpen={!!linkToOpen}
          onClose={() => setLinkToOpen(null)}
          url={linkToOpen || ''}
          onConfirm={confirmOpenLink}
        />
      </>
    );
  }
);

StreamingMarkdown.displayName = 'StreamingMarkdown';

/**
 * =============================================================
 * Memoized block renderer
 * Prevents ALL markdown from rerendering during streaming
 * =============================================================
 */

interface MemoizedMarkdownBlockProps {
  block: any;
  isStreaming: boolean;

  onLinkClick: (url: string) => void;

  showLineNumbers: boolean;
  collapsibleCode: boolean;
  sortableTables: boolean;
  autoNumberHeadings: boolean;
}

const MemoizedMarkdownBlock = memo(
  ({
    block,
    isStreaming,

    onLinkClick,

    showLineNumbers,
    collapsibleCode,
    sortableTables,
    autoNumberHeadings,
  }: MemoizedMarkdownBlockProps) => {
    return (
      <MarkdownRenderer
        content={block.raw}
        block={block}
        isStreaming={isStreaming}
        onLinkClick={onLinkClick}
        showLineNumbers={showLineNumbers}
        collapsibleCode={collapsibleCode}
        sortableTables={sortableTables}
        autoNumberHeadings={autoNumberHeadings}
      />
    );
  },
  (prev, next) => {
    /**
     * Prevent rerender unless actual block content changes
     */

    return (
      prev.block.raw === next.block.raw &&
      prev.isStreaming === next.isStreaming &&
      prev.showLineNumbers === next.showLineNumbers &&
      prev.collapsibleCode === next.collapsibleCode &&
      prev.sortableTables === next.sortableTables &&
      prev.autoNumberHeadings === next.autoNumberHeadings
    );
  }
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';
