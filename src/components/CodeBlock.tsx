import { useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  .san-cb-root {
    position: relative;
    margin: 16px 0;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #0d1117;
    overflow: hidden;
    width: 100%;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 4px 24px rgba(0, 0, 0, 0.4);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .san-cb-root:hover {
    border-color: rgba(255,255,255,0.13);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.06),
      0 6px 32px rgba(0, 0, 0, 0.5);
  }

  /* Header bar */
  .san-cb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    user-select: none;
  }

  .san-cb-lang-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Language dot */
  .san-cb-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: hsl(var(--primary) / 0.8);
    box-shadow: 0 0 6px hsl(var(--primary) / 0.5);
    flex-shrink: 0;
  }

  .san-cb-lang {
    font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .san-cb-line-count {
    font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    padding: 2px 7px;
    background: rgba(255,255,255,0.05);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.07);
  }

  /* Copy button */
  .san-cb-copy-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.45);
    font-size: 11px;
    font-weight: 500;
    font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1;
  }

  .san-cb-copy-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.75);
  }

  .san-cb-copy-btn:active {
    transform: scale(0.95);
  }

  .san-cb-copy-btn.copied {
    background: rgba(74, 222, 128, 0.1);
    border-color: rgba(74, 222, 128, 0.25);
    color: #4ade80;
  }

  /* Copy icon animation */
  .san-cb-copy-icon {
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease;
  }

  .san-cb-copy-btn.copied .san-cb-copy-icon {
    transform: scale(1.15);
  }

  /* Scroll container */
  .san-cb-scroll {
    position: relative;
    max-height: 500px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }

  .san-cb-scroll::-webkit-scrollbar {
    width: 4px;
  }

  .san-cb-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .san-cb-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
  }

  .san-cb-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.18);
  }
`;

// ─── Language color map (dot accent) ─────────────────────────────────────────
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

  const lineCount = code.split('\n').length;
  const dotColor = LANG_COLORS[language.toLowerCase()] ?? 'hsl(var(--primary) / 0.8)';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert({
        title: 'Copied',
        description: 'Code copied to clipboard',
        variant: 'success',
      });
    } catch {
      alert({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="san-cb-root">

        {/* ─── Header ─── */}
        <div className="san-cb-header">
          <div className="san-cb-lang-group">
            <span
              className="san-cb-dot"
              style={{ background: dotColor, boxShadow: `0 0 7px ${dotColor}80` }}
            />
            <span className="san-cb-lang">{language}</span>
            <span className="san-cb-line-count">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
          </div>

          <button
            className={`san-cb-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            <span className="san-cb-copy-icon">
              {copied
                ? <Check size={11} strokeWidth={2.5} />
                : <Copy size={11} strokeWidth={2} />
              }
            </span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* ─── Code Area ─── */}
        <div className="san-cb-scroll">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            wrapLongLines={true}
            customStyle={{
              margin: 0,
              padding: '14px 18px',
              background: 'transparent',
              fontSize: '0.8125rem',
              lineHeight: 1.75,
              fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            }}
            codeTagProps={{
              style: {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
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
