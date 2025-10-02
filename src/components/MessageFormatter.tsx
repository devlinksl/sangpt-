import { CodeBlock } from './CodeBlock';

interface MessageFormatterProps {
  content: string;
}

export const MessageFormatter = ({ content }: MessageFormatterProps) => {
  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
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
        const formatted = part
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
          // Line breaks
          .replace(/\n/g, '<br/>');

        return (
          <div 
            key={index} 
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      })}
    </div>
  );
};
