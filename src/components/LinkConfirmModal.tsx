import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface LinkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onConfirm: () => void;
}

export const LinkConfirmModal = ({ isOpen, onClose, url, onConfirm }: LinkConfirmModalProps) => {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-background/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
        
        <div className="px-6">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-semibold">Open External Link</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">You are about to open:</p>
          <p className="text-sm font-mono bg-muted p-3 rounded-lg break-all">{url}</p>
        </div>

        <DrawerFooter className="px-6 pb-8 flex-row gap-3">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>
              Cancel
            </Button>
          </DrawerClose>
          <Button 
            onClick={onConfirm} 
            className="flex-1 rounded-full bg-primary text-primary-foreground"
          >
            Continue
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
