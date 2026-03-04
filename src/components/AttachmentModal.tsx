import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Camera, Image, FileText, ImageIcon, Globe, Mic, Gamepad2 } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
}

export const AttachmentModal = ({ isOpen, onClose, onFileSelect }: AttachmentModalProps) => {
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

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-background/50 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
        
        <div className="px-6 pb-6">
          {/* Grid layout */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleFileInput('image/*')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Camera</span>
            </button>

            <button
              onClick={() => handleFileInput('image/*')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <Image className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Photos</span>
            </button>

            <button
              onClick={() => handleFileInput('.pdf,.doc,.docx,.txt')}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Files</span>
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Generate</span>
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Research</span>
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Podcast</span>
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors border border-border/30 active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Quiz</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
