 import {
   Drawer,
   DrawerClose,
   DrawerContent,
   DrawerDescription,
   DrawerFooter,
   DrawerHeader,
   DrawerTitle,
 } from '@/components/ui/drawer';
 import { Button } from '@/components/ui/button';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
 
 interface AlertModalProps {
   isOpen: boolean;
   onClose: () => void;
   title?: string;
   description?: string;
   variant?: 'default' | 'destructive' | 'success' | 'warning';
 }
 
 export const AlertModal = ({ 
   isOpen, 
   onClose, 
   title, 
   description, 
   variant = 'default' 
 }: AlertModalProps) => {
   const icons = {
     default: <Info className="h-6 w-6 text-foreground" />,
     destructive: <AlertCircle className="h-6 w-6 text-destructive" />,
     success: <CheckCircle className="h-6 w-6 text-primary" />,
     warning: <AlertTriangle className="h-6 w-6 text-destructive" />,
   };
 
   return (
     <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <DrawerContent className="max-h-[85vh] bg-background/50 backdrop-blur-2xl backdrop-saturate-150">
         <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
         <ScrollArea className="max-h-[60vh] overflow-y-auto">
           <DrawerHeader className="flex flex-col items-center text-center gap-3 px-6">
             <div className="p-3 rounded-full bg-muted">
               {icons[variant]}
             </div>
             {title && (
               <DrawerTitle className="text-lg font-semibold">
                 {title}
               </DrawerTitle>
             )}
             {description && (
               <DrawerDescription className="text-muted-foreground text-base">
                 {description}
               </DrawerDescription>
             )}
           </DrawerHeader>
         </ScrollArea>
         <DrawerFooter className="px-6 pb-8">
           <DrawerClose asChild>
             <Button 
               onClick={onClose}
               className="w-full rounded-full"
             >
               OK
             </Button>
           </DrawerClose>
         </DrawerFooter>
       </DrawerContent>
     </Drawer>
   );
 };