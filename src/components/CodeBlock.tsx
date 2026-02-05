 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Check, Copy } from 'lucide-react';
 import { useToast } from '@/hooks/use-toast';
 import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
 import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
 
 interface CodeBlockProps {
   code: string;
   language?: string;
 }
 
 export const CodeBlock = ({ code, language = 'text' }: CodeBlockProps) => {
   const [copied, setCopied] = useState(false);
   const { toast } = useToast();
 
   const handleCopy = async () => {
     try {
       await navigator.clipboard.writeText(code);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
 
       toast({
         title: "Copied",
         description: "Code copied to clipboard",
       });
     } catch (error) {
       toast({
         title: "Copy failed",
         description: "Could not copy to clipboard",
         variant: "destructive",
       });
     }
   };
 
   return (
     <div className="relative group my-4 rounded-xl border border-border/50 bg-[#0d1117] overflow-hidden w-full">
       {/* Language Header with Copy Button */}
       <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-border/30">
         <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
           {language}
         </span>
         <Button
           variant="ghost"
           size="sm"
           onClick={handleCopy}
           className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
         >
           {copied ? (
             <>
               <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" />
               <span className="text-green-400">Copied!</span>
             </>
           ) : (
             <>
               <Copy className="h-3.5 w-3.5 mr-1.5" />
               <span>Copy</span>
             </>
           )}
         </Button>
       </div>
 
       {/* Code Area - vertical scroll only, wrap long lines */}
       <div className="relative max-h-[500px] overflow-y-auto overflow-x-hidden">
         <SyntaxHighlighter
           language={language}
           style={vscDarkPlus}
           wrapLongLines={true}
           customStyle={{
             margin: 0,
             padding: '1rem 1.25rem',
             background: 'transparent',
             fontSize: '0.875rem',
             lineHeight: 1.7,
             fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
           }}
           codeTagProps={{
             style: {
               whiteSpace: 'pre-wrap',
               wordBreak: 'break-word',
               overflowWrap: 'break-word',
             }
           }}
         >
           {code}
         </SyntaxHighlighter>
       </div>
     </div>
   );
 };
