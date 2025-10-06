import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = 'text' }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Copied",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-gray-700 max-w-full">
      {/* Copy Button */}
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border border-white/20"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Language Header */}
      <div className="bg-[#1E1E1E] text-gray-300 px-4 py-2 text-xs font-mono border-b border-gray-700 flex items-center justify-between">
        <span>{language}</span>
      </div>

      {/* Code Area */}
      <div className="bg-[#1E1E1E] max-w-full overflow-x-auto">
        <div className="min-w-0 w-full">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            wrapLongLines={true}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#1E1E1E',
              fontSize: '0.875rem',
              maxWidth: '100%',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};
