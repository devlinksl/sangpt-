 import { useState, useRef, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { 
   Image, 
   Camera, 
   FileText, 
   Mic, 
   Send,
   Sparkles
 } from 'lucide-react';
 import { SpeechToText } from '@/components/SpeechToText';
 import { cn } from '@/lib/utils';
 
 interface ChatInputBarProps {
   value: string;
   onChange: (value: string) => void;
   onSend: () => void;
   onAttachment: (type: 'image' | 'camera' | 'file') => void;
   onModelSelect: () => void;
   onRecordingChange: (isRecording: boolean) => void;
   onTranscription: (text: string) => void;
   isLoading: boolean;
   isRecording: boolean;
   isStoppable: boolean;
   onStop: () => void;
   disabled?: boolean;
 }
 
 export const ChatInputBar = ({
   value,
   onChange,
   onSend,
   onAttachment,
   onModelSelect,
   onRecordingChange,
   onTranscription,
   isLoading,
   isRecording,
   isStoppable,
   onStop,
   disabled
 }: ChatInputBarProps) => {
   const [isFocused, setIsFocused] = useState(false);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   
   const showActions = isFocused || value.length > 0;
   
   // Auto-resize textarea
   useEffect(() => {
     if (textareaRef.current) {
       textareaRef.current.style.height = 'auto';
       const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
       textareaRef.current.style.height = newHeight + 'px';
     }
   }, [value]);
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       if (value.trim()) {
         onSend();
       }
     }
   };
 
   const handleFileInput = (type: 'image' | 'camera' | 'file') => {
     onAttachment(type);
   };
 
   return (
     <div className="w-full max-w-3xl mx-auto px-3">
       {/* Main glass container */}
       <div className="relative rounded-[28px] bg-card/80 dark:bg-card/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden transition-all duration-300">
         {/* Textarea area */}
         <div className="px-4 pt-4 pb-2">
           <textarea
             ref={textareaRef}
             value={value}
             onChange={(e) => onChange(e.target.value)}
             onFocus={() => setIsFocused(true)}
             onBlur={() => setTimeout(() => setIsFocused(false), 150)}
             onKeyPress={handleKeyPress}
             placeholder="Ask Anything...."
             disabled={disabled || isLoading || isRecording}
             className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-base resize-none outline-none min-h-[28px] max-h-[150px] leading-relaxed"
             rows={1}
           />
         </div>
         
         {/* Action bar - always visible container, content fades */}
         <div className="px-3 pb-3 pt-1">
           <div className="flex items-center justify-between">
             {/* Left side - action buttons */}
             <div 
               className={cn(
                 "flex items-center gap-1 transition-all duration-300 ease-out",
                 showActions 
                   ? "opacity-100 translate-y-0" 
                   : "opacity-0 translate-y-2 pointer-events-none"
               )}
             >
               {/* Media/Image button */}
               <button
                 onClick={() => handleFileInput('image')}
                 className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95"
                 type="button"
               >
                 <Image className="h-5 w-5" />
               </button>
               
               {/* Camera button */}
               <button
                 onClick={() => handleFileInput('camera')}
                 className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95"
                 type="button"
               >
                 <Camera className="h-5 w-5" />
               </button>
               
               {/* File/Document button */}
               <button
                 onClick={() => handleFileInput('file')}
                 className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95"
                 type="button"
               >
                 <FileText className="h-5 w-5" />
               </button>
               
               {/* Voice button - using SpeechToText component */}
              <div className="flex items-center justify-center">
                 <SpeechToText 
                   onTranscription={(text) => {
                     onTranscription(text);
                     onRecordingChange(false);
                   }}
                   disabled={isLoading}
                   onRecordingChange={onRecordingChange}
                 />
               </div>
               
               {/* Model selector pill */}
               <button
                 onClick={onModelSelect}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all active:scale-95 ml-1"
                 type="button"
               >
                 <Sparkles className="h-3.5 w-3.5" />
                 <span>SanGPT</span>
               </button>
             </div>
             
             {/* Right side - send button */}
             <Button
               onClick={() => {
                 if (isLoading && isStoppable) {
                   onStop();
                 } else if (value.trim()) {
                   onSend();
                 }
               }}
               disabled={!value.trim() && !isLoading}
               size="icon"
               className={cn(
                 "h-10 w-10 rounded-full transition-all duration-200 shadow-md",
                 isLoading && isStoppable
                   ? "bg-destructive hover:bg-destructive/90"
                   : value.trim()
                     ? "bg-primary hover:bg-primary/90 scale-100"
                     : "bg-primary/50 scale-95 opacity-60"
               )}
             >
               {isLoading && isStoppable ? (
                 <div className="h-3 w-3 bg-destructive-foreground rounded-sm" />
               ) : (
                 <Send className="h-4 w-4 text-primary-foreground" />
               )}
             </Button>
           </div>
         </div>
       </div>
     </div>
   );
 };