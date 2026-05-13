import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  /* ── Root ── */
  .san-cb-root {
    position: relative;
    margin: 12px 0;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    font-family: 'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  /* DARK MODE */
  .san-cb-root {
    background: #1c1c1e;
    border: 1px solid rgba(255, 255, 255, 0.09);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
  }

  /* LIGHT MODE */
  @media (prefers-color-scheme: light) {
    .san-cb-root {
      background: #f5f5f5;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }
  }

  /* Tailwind dark class override */
  :root[class~="dark"] .san-cb-root,
  .dark .san-cb-root {
    background: #1c1c1e;
    border: 1px solid rgba(255, 255, 255, 0.09);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
  }

  :root:not([class~="dark"]) .san-cb-root,
  .light .san-cb-root {
    background: #f5f5f5;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }

  /* ── Header ── */
  .san-cb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px 10px 16px;
    user-select: none;
  }

  .san-cb-root .san-cb-header {
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  :root:not([class~="dark"]) .san-cb-root .san-cb-header,
  .light .san-cb-root .san-cb-header {
    background: rgba(0, 0, 0, 0.04);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  /* ── Language label ── */
  .san-cb-lang {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .san-cb-root .san-cb-lang {
    color: rgba(255, 255, 255, 0.55);
  }

  :root:not([class~="dark"]) .san-cb-root .san-cb-lang,
  .light .san-cb-root .san-cb-lang {
    color: rgba(0, 0, 0, 0.45);
  }

  /* ── Copy button ── */
  .san-cb-copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border-radius: 7px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
    line-height: 1;
  }

  .san-cb-root .san-cb-copy-btn {
    color: rgba(255, 255, 255, 0.4);
  }

  .san-cb-root .san-cb-copy-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.75);
  }

  :root:not([class~="dark"]) .san-cb-root .san-cb-copy-btn,
  .light .san-cb-root .san-cb-copy-btn {
    color: rgba(0, 0, 0, 0.35);
  }

  :root:not([class~="dark"]) .san-cb-root .san-cb-copy-btn:hover,
  .light .san-cb-root .san-cb-copy-btn:hover {
    background: rgba(0, 0, 0, 0.07);
    color: rgba(0, 0, 0, 0.7);
  }

  .san-cb-copy-btn:active {
    transform: scale(0.9);
  }

  .san-cb-copy-btn.copied {
    color: #4ade80 !important;
    background: rgba(74, 222, 128, 0.1) !important;
  }

  /* ── Scroll / Code area ── */
  /* No max-height cap — block grows naturally with content.
     Horizontal scroll for wide lines instead of wrapping. */
  .san-cb-scroll {
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: thin;
  }

  .san-cb-root .san-cb-scroll {
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  }

  :root:not([class~="dark"]) .san-cb-root .san-cb-scroll,
  .light .san-cb-root .san-cb-scroll {
    scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
  }

  .san-cb-scroll::-webkit-scrollbar {
    height: 4px;
    width: 4px;
  }

  .san-cb-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .san-cb-root .san-cb-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  :root:not([class~="dark"]) .san-cb-root .san-cb-scroll::-webkit-scrollbar-thumb,
  .light .san-cb-root .san-cb-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 4px;
  }

  /* Override SyntaxHighlighter backgrounds */
  .san-cb-root pre,
  .san-cb-root code {
    background: transparent !important;
  }
`;

// ─── Light-mode syntax theme (hand-tuned) ─────────────────────────────────────
const lightTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#24292e',
    background: 'transparent',
    fontFamily: "'SF Mono', ui-monospace, Menlo, Consolas, monospace",
    fontSize: '0.8125rem',
    lineHeight: '1.75',
  },
  'pre[class*="language-"]': {
    color: '#24292e',
    background: 'transparent',
  },
  comment: { color: '#6a737d', fontStyle: 'italic' },
  punctuation: { color: '#24292e' },
  keyword: { color: '#d73a49' },
  string: { color: '#032f62' },
  number: { color: '#005cc5' },
  boolean: { color: '#005cc5' },
  function: { color: '#6f42c1' },
  'class-name': { color: '#6f42c1' },
  operator: { color: '#d73a49' },
  tag: { color: '#22863a' },
  'attr-name': { color: '#6f42c1' },
  'attr-value': { color: '#032f62' },
};

// ─── Language color map ───────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  tsx:        '#3178c6',
  jsx:        '#61dafb',
  python:     '#3572a5',
  rust:       '#ce422b',
  go:         '#00add8',
  css:        '#563d7c',
  html:       '#e44d26',
  json:       '#6b8e23',
  bash:       '#89e051',
  shell:      '#89e051',
  sql:        '#e38c00',
  swift:      '#fa7343',
  kotlin:     '#7f52ff',
  java:       '#b07219',
  c:          '#555555',
  cpp:        '#f34b7d',
  ruby:       '#701516',
  php:        '#4f5d95',
  yaml:       '#cb171e',
  markdown:   '#083fa1',
};

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = 'text' }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { alert } = useAlert();

  // Detect dark mode via Tailwind class on <html>
  const isDark =
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true;

  const dotColor = LANG_COLORS[language.toLowerCase()] ?? '#888';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert({ title: 'Copied', description: 'Code copied to clipboard', variant: 'success' });
    } catch {
      alert({ title: 'Copy failed', description: 'Could not copy to clipboard', variant: 'destructive' });
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="san-cb-root">

        {/* ── Header ── */}
        <div className="san-cb-header">
          <span className="san-cb-lang" style={{ color: dotColor }}>
            {language.toUpperCase()}
          </span>

          <button
            className={`san-cb-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy code'}
          >
            {copied
              ? <Check size={15} strokeWidth={2.5} />
              : <Copy size={15} strokeWidth={2} />
            }
          </button>
        </div>

        {/* ── Code ── */}
        <div className="san-cb-scroll">
          <SyntaxHighlighter
            language={language}
            style={isDark ? vscDarkPlus : lightTheme}
            wrapLongLines={false}
            customStyle={{
              margin: 0,
              padding: '14px 18px 18px',
              background: 'transparent',
              fontSize: '0.8125rem',
              lineHeight: 1.75,
              fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              minWidth: '100%',
              width: 'max-content',
            }}
            codeTagProps={{
              style: {
                whiteSpace: 'pre',
                wordBreak: 'normal',
                overflowWrap: 'normal',
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

      </div>
    </>
  );
};
