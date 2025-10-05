import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, TextSelect, Volume2, Share2, RotateCcw } from 'lucide-react';

interface LongPressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  onSelectText: () => void;
  onReadAloud: () => void;
  onRegenerate: () => void;
  onShare?: () => void;
  conversationId?: string | null;
}

export const LongPressModal = ({ 
  isOpen, 
  onClose,
  onCopy,
  onSelectText,
  onReadAloud,
  onRegenerate,
  onShare,
  conversationId
}: LongPressModalProps) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bottom-0 top-auto translate-y-0 slide-in-from-bottom animate-slide-in-bottom rounded-t-3xl rounded-b-none border-0 p-0">
        <div className="px-6 pt-6 pb-2">
          <div className="w-12 h-1 bg-border mx-auto rounded-full mb-4" />
          <h3 className="text-center font-semibold text-lg mb-2">Message Actions</h3>
        </div>
        
        <div className="flex flex-col gap-1 pb-6">
          <Button
            variant="ghost"
            onClick={() => handleAction(onCopy)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
          >
            <Copy className="h-5 w-5 mr-3" />
            Copy
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleAction(onSelectText)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
          >
            <TextSelect className="h-5 w-5 mr-3" />
            Select text
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleAction(onReadAloud)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
          >
            <Volume2 className="h-5 w-5 mr-3" />
            Read aloud
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleAction(onRegenerate)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
          >
            <RotateCcw className="h-5 w-5 mr-3" />
            Regenerate
          </Button>

          {onShare && (
            <Button
              variant="ghost"
              onClick={() => handleAction(onShare)}
              className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
            >
              <Share2 className="h-5 w-5 mr-3" />
              Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
