import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Zap, Check } from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const models = [
  {
    id: 'lovable',
    name: 'SanGPT',
    description: 'Recommended — fastest streaming response',
    badge: 'Fastest',
  },
  {
    id: 'gemini',
    name: 'SanGPT Experimental',
    description: 'Alternate model — may be less stable',
    badge: 'Beta',
  },
];

export const ModelSelectorModal = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}: ModelSelectorModalProps) => {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="bg-background/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-border/30 select-none">
        <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-muted/70 mt-2 mb-3" />
        <DrawerTitle className="sr-only">Select model</DrawerTitle>
        <DrawerDescription className="sr-only">
          Choose which AI model to use for responses.
        </DrawerDescription>

        <div className="px-3 pb-5 pt-1 space-y-1.5">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Model
          </p>
          {models.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => { onSelectModel(model.id); onClose(); }}
                className={`w-full text-left p-3.5 rounded-2xl transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-primary/10 ring-1 ring-primary/40'
                    : 'bg-card/40 hover:bg-card/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-primary/15 text-primary' : 'bg-muted/40 text-muted-foreground'
                  }`}>
                    <Zap className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{model.name}</span>
                      {model.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground uppercase tracking-wider">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
