import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image, FileText, ImageIcon, Globe, Mic, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
}

export const AttachmentModal = ({ isOpen, onClose, onFileSelect }: AttachmentModalProps) => {
  const { toast } = useToast();

  const handleFileInput = (accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onFileSelect(files);
        onClose();
      }
    };
    input.click();
  };

  const handleFeature = (feature: string) => {
    toast({
      title: `${feature} coming soon`,
      description: "This feature will be available in a future update.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bottom-0 top-auto translate-y-0 slide-in-from-bottom animate-slide-in-bottom rounded-t-3xl rounded-b-none border-0 p-0">
        <div className="px-6 pt-6 pb-2">
          <div className="w-12 h-1 bg-border mx-auto rounded-full mb-6" />
        </div>
        
        <div className="px-6 pb-6 space-y-4">
          {/* File Upload Options */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleFileInput('image/*')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Camera</span>
            </button>

            <button
              onClick={() => handleFileInput('image/*')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center">
                <Image className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Photos</span>
            </button>

            <button
              onClick={() => handleFileInput('.pdf,.doc,.docx,.txt')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Files</span>
            </button>
          </div>

          {/* Feature Options */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-14 px-4 rounded-xl hover:bg-muted"
              onClick={() => handleFeature('Image Generation')}
            >
              <ImageIcon className="w-5 h-5 mr-3" />
              <span className="text-base">Generate Image</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between text-left h-14 px-4 rounded-xl hover:bg-muted"
              onClick={() => handleFeature('Deep Research')}
            >
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-3" />
                <span className="text-base">Start deep research</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                10 remaining
              </span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between text-left h-14 px-4 rounded-xl hover:bg-muted"
              onClick={() => handleFeature('Podcast')}
            >
              <div className="flex items-center">
                <Mic className="w-5 h-5 mr-3" />
                <span className="text-base">Create a podcast</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                3 remaining
              </span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left h-14 px-4 rounded-xl hover:bg-muted"
              onClick={() => handleFeature('Quiz')}
            >
              <Gamepad2 className="w-5 h-5 mr-3" />
              <span className="text-base">Start a quiz</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
