import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Camera, Image, FileText, ImageIcon, Globe, Mic, Gamepad2 } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
}

export const AttachmentModal = ({ isOpen, onClose, onFileSelect }: AttachmentModalProps) => {
  const { alert } = useAlert();

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
    alert({
      title: "Coming Soon",
      description: "This feature will be available in a future update.",
    });
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-background/50 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
        
        <div className="px-6 pb-6 space-y-4">
          {/* File Upload Options */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleFileInput('image/*')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30"
            >
                <div className="w-12 h-12 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Camera</span>
            </button>

            <button
              onClick={() => handleFileInput('image/*')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30"
            >
                <div className="w-12 h-12 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <Image className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Photos</span>
            </button>

            <button
              onClick={() => handleFileInput('.pdf,.doc,.docx,.txt')}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center">
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
      </DrawerContent>
    </Drawer>
  );
};
