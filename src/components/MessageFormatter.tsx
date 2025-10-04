import { CodeBlock } from './CodeBlock';
import { useState } from 'react';
import { LinkConfirmModal } from './LinkConfirmModal';

interface MessageFormatterProps {
  content: string;
}

export const MessageFormatter = ({ content }: MessageFormatterProps) => {
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

  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {parts.map((part, index) => {
          // Check if it's a code block
          if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.split('\n');
            const language = lines[0].replace('```', '').trim() || 'text';
            const code = lines.slice(1, -1).join('\n');
            
            return <CodeBlock key={index} code={code} language={language} />;
          }

          // Format regular text with markdown-like features
          let formatted = part
            // Highlight "Imagine" keyword in blue
            .replace(/\b(imagine)\b/gi, '<span class="text-blue-500 font-semibold">$1</span>')
            // Bold text with **
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            // Italic text with *
            .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
            // Headings with *
            .replace(/^\*\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
            // Images
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-4" />')
            // URLs - make them blue and underlined with click handler
            .replace(
              /(https?:\/\/[^\s<]+)/g,
              '<a href="$1" class="text-blue-500 underline hover:text-blue-600" data-link="$1">$1</a>'
            )
            // Line breaks
            .replace(/\n/g, '<br/>');

          return (
            <div 
              key={index} 
              dangerouslySetInnerHTML={{ __html: formatted }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'A' && target.dataset.link) {
                  handleLinkClick(e, target.dataset.link);
                }
              }}
            />
          );
        })}
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
