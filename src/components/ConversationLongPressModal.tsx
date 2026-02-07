import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Edit2, Pin, PinOff, Trash2 } from 'lucide-react';

interface ConversationLongPressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
  onRename: () => void;
  onPin: () => void;
  onDelete: () => void;
}

export const ConversationLongPressModal = ({ 
  isOpen, 
  onClose,
  isPinned,
  onRename,
  onPin,
  onDelete
}: ConversationLongPressModalProps) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-background/50 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
        <div className="px-6 pb-2">
          <h3 className="text-center font-semibold text-lg mb-2">Conversation Actions</h3>
        </div>
        
        <div className="flex flex-col gap-1 pb-6">
          <Button
            variant="ghost"
            onClick={() => handleAction(onRename)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
          >
            <Edit2 className="h-5 w-5 mr-3" />
            Rename
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleAction(onPin)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted"
          >
            {isPinned ? (
              <>
                <PinOff className="h-5 w-5 mr-3" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-5 w-5 mr-3" />
                Pin
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleAction(onDelete)}
            className="w-full justify-start text-left h-auto py-4 px-6 rounded-none hover:bg-muted text-destructive"
          >
            <Trash2 className="h-5 w-5 mr-3" />
            Delete
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
