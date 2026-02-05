import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Highlighter, Copy, Share2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
 import { useAlert } from '@/hooks/useAlert';

export const TextSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
   const { alert } = useAlert();
  const content = location.state?.content || '';
  const conversationId = location.state?.conversationId || null;
  const [selectedText, setSelectedText] = useState('');

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText || content);
       alert({
        title: "Copied",
        description: "Text copied to clipboard",
         variant: "success",
      });
    } catch (error) {
       alert({
        title: "Error",
        description: "Could not copy text",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: selectedText || content,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (conversationId) {
                navigate('/', { state: { conversationId } });
              } else {
                navigate('/');
              }
            }}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {selectedText && (
              <span className="text-sm text-muted-foreground">
                {selectedText.length} characters selected
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              disabled={!selectedText && !content}
            >
              <Copy className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              disabled={!selectedText && !content}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div
          className="prose prose-sm dark:prose-invert max-w-none select-text"
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>

        {selectedText && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full px-6 py-3 shadow-lg flex items-center gap-4 animate-slide-in-bottom">
            <Highlighter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Text selected</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="rounded-full"
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleShare}
                className="rounded-full"
              >
                Share
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
