import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Brain, Sparkles } from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const models = [
  {
    id: 'gemini',
    name: 'SanGPT Experimental',
    description: 'Alternate model (may be less stable)',
    icon: Sparkles,
    speed: '2-3 sec',
    badge: 'Alt'
  },
  {
    id: 'lovable',
    name: 'SanGPT',
    description: 'Recommended (fast & reliable)',
    icon: Brain,
    speed: '3-5 sec',
    badge: '✓'
  }
];

export const ModelSelectorModal = ({ 
  isOpen, 
  onClose, 
  selectedModel, 
  onSelectModel 
}: ModelSelectorModalProps) => {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-background/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
        <DrawerTitle className="sr-only">Select model</DrawerTitle>
        <DrawerDescription className="sr-only">
          Choose which AI model to use for responses.
        </DrawerDescription>
        
        <div className="px-6 pb-6 space-y-3">
          {models.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModel === model.id;
            
            return (
              <button
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl transition-colors ${
                  isSelected 
                    ? 'bg-primary/10 backdrop-blur-sm border-2 border-primary' 
                    : 'bg-card/40 backdrop-blur-sm hover:bg-card/60 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 text-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.speed}</span>
                        {model.badge && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.description}
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
