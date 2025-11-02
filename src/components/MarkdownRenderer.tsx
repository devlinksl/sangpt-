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
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
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
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-7 text-foreground">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            if (!inline && match) {
              return <CodeBlock code={codeString} language={match[1]} />;
            }
            
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <button
              onClick={(e) => href && handleLinkClick(e, href)}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors"
            >
              {children || formatLinkDisplay(href || '')}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg max-w-full h-auto my-4 shadow-md"
            />
          ),
        }}
        >
          {content}
        </ReactMarkdown>
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
