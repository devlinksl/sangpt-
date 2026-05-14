import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { useState } from 'react';
import { LinkConfirmModal } from './LinkConfirmModal';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer = ({ content, isStreaming = false }: MarkdownRendererProps) => {
  const [linkToOpen, setLinkToOpen] = useState<string | null>(null);

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    setLinkToOpen(url);
  };

  const confirmOpenLink = () => {
    if (linkToOpen) {
      window.open(linkToOpen, '_blank', 'noopener,noreferrer');
      setLinkToOpen(null);
    }
  };

  const formatLinkDisplay = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname.replace('www.', '');
      return domain
        .split('.')
        .slice(0, -1)
        .join(' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      return url;
    }
  };

  return (
    <>
      <style>{`
        /* ── Streaming cursor ── */
        @keyframes mr-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .mr-cursor {
          display: inline-block;
          width: 2px;
          height: 1.05em;
          background: hsl(var(--primary) / 0.85);
          border-radius: 1px;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: mr-blink 1s step-start infinite;
        }

        /* ── Table striped rows ── */
        .mr-table tbody tr:nth-child(even) {
          background-color: hsl(var(--muted) / 0.4);
        }
        .mr-table tbody tr:hover {
          background-color: hsl(var(--muted) / 0.65);
        }

        /* ── Link hover ── */
        .mr-link:hover {
          color: hsl(var(--primary) / 0.75);
          text-decoration-color: hsl(var(--primary) / 0.5);
        }
        .mr-link:focus-visible {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
          border-radius: 3px;
        }

        /* ── H2 bottom border ── */
        .mr-h2 {
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 0.35em;
        }

        @media (prefers-reduced-motion: reduce) {
          .mr-cursor { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="ai-response max-w-none" style={{ lineHeight: 1.75, fontSize: '15px' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{

            /* ── Headings ── */
            h1: ({ children }) => (
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                marginTop: '1.6em',
                marginBottom: '0.6em',
                color: 'hsl(var(--foreground))',
              }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mr-h2" style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                lineHeight: 1.35,
                letterSpacing: '-0.015em',
                marginTop: '1.5em',
                marginBottom: '0.55em',
                color: 'hsl(var(--foreground))',
              }}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
                marginTop: '1.3em',
                marginBottom: '0.45em',
                color: 'hsl(var(--foreground))',
              }}>
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.4,
                marginTop: '1.1em',
                marginBottom: '0.4em',
                color: 'hsl(var(--foreground))',
              }}>
                {children}
              </h4>
            ),

            /* ── Paragraph ── */
            p: ({ children }) => (
              <p style={{
                marginBottom: '0.9em',
                lineHeight: 1.78,
                color: 'hsl(var(--foreground))',
                letterSpacing: '0.005em',
              }}>
                {children}
              </p>
            ),

            /* ── Lists ── */
            ul: ({ children }) => (
              <ul style={{
                listStyleType: 'disc',
                paddingLeft: '1.6em',
                marginBottom: '0.9em',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3em',
              }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol style={{
                listStyleType: 'decimal',
                paddingLeft: '1.6em',
                marginBottom: '0.9em',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3em',
              }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{
                lineHeight: 1.75,
                color: 'hsl(var(--foreground))',
                paddingLeft: '0.2em',
              }}>
                {children}
              </li>
            ),

            /* ── Inline code ── */
            code: ({ inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');

              if (!inline && match) {
                return <CodeBlock code={codeString} language={match[1]} />;
              }

              // Inline code — stands out clearly
              return (
                <code
                  style={{
                    background: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))',
                    padding: '0.1em 0.45em',
                    borderRadius: '5px',
                    fontSize: '0.835em',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                    color: 'hsl(var(--foreground))',
                    fontWeight: 450,
                    letterSpacing: '0.01em',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            },

            /* ── Links ── */
            a: ({ href, children }) => (
              <button
                onClick={(e) => href && handleLinkClick(e, href)}
                className="mr-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: 'hsl(var(--primary))',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  textDecorationColor: 'hsl(var(--primary) / 0.35)',
                  transition: 'color 0.15s, text-decoration-color 0.15s',
                }}
              >
                {children || formatLinkDisplay(href || '')}
                <svg
                  style={{ flexShrink: 0, opacity: 0.7 }}
                  width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            ),

            /* ── Blockquote ── */
            blockquote: ({ children }) => (
              <blockquote style={{
                borderLeft: '3px solid hsl(var(--primary) / 0.55)',
                background: 'hsl(var(--muted) / 0.35)',
                borderRadius: '0 6px 6px 0',
                padding: '0.65em 1em',
                margin: '1em 0',
                color: 'hsl(var(--muted-foreground))',
                fontStyle: 'italic',
                lineHeight: 1.7,
              }}>
                {children}
              </blockquote>
            ),

            /* ── Strong / Em ── */
            strong: ({ children }) => (
              <strong style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em style={{ fontStyle: 'italic', color: 'hsl(var(--foreground))' }}>
                {children}
              </em>
            ),

            /* ── HR ── */
            hr: () => (
              <hr style={{
                border: 'none',
                borderTop: '1px solid hsl(var(--border))',
                margin: '1.4em 0',
              }} />
            ),

            /* ── Table ── */
            table: ({ children }) => (
              <div style={{
                overflowX: 'auto',
                margin: '1.1em 0',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <table className="mr-table" style={{
                  minWidth: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                }}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead style={{ background: 'hsl(var(--muted))' }}>
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th style={{
                padding: '10px 14px',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.02em',
                color: 'hsl(var(--foreground))',
                borderBottom: '1px solid hsl(var(--border))',
                whiteSpace: 'nowrap',
              }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td style={{
                padding: '9px 14px',
                color: 'hsl(var(--foreground))',
                borderBottom: '1px solid hsl(var(--border) / 0.5)',
                verticalAlign: 'top',
                lineHeight: 1.6,
              }}>
                {children}
              </td>
            ),

            /* ── Image ── */
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                loading="lazy"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: '1.1em 0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>

        {isStreaming && <span className="mr-cursor" aria-hidden="true" />}
      </div>

      <LinkConfirmModal
        isOpen={!!linkToOpen}
        onClose={() => setLinkToOpen(null)}
        url={linkToOpen || ''}
        onConfirm={confirmOpenLink}
      />
    </>
  );
};
