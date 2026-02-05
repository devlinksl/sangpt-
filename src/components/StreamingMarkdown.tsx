 import ReactMarkdown from 'react-markdown';
 import remarkGfm from 'remark-gfm';
 import remarkMath from 'remark-math';
 import rehypeKatex from 'rehype-katex';
 import 'katex/dist/katex.min.css';
 import { CodeBlock } from './CodeBlock';
 import { useState, useMemo } from 'react';
 import { LinkConfirmModal } from './LinkConfirmModal';
 
 interface StreamingMarkdownProps {
   content: string;
   isStreaming?: boolean;
 }
 
 export const StreamingMarkdown = ({ content, isStreaming = false }: StreamingMarkdownProps) => {
   const [linkToOpen, setLinkToOpen] = useState<string | null>(null);
 
   const handleLinkClick = (e: React.MouseEvent, url: string) => {
     e.preventDefault();
     setLinkToOpen(url);
   };
 
   const confirmOpenLink = () => {
     if (linkToOpen) {
       window.open(linkToOpen, '_blank', 'noopener,noreferrer');
       setLinkToOpen(null);
     }
   };
 
   // Process content to auto-detect first meaningful sentence as heading
   const processedContent = useMemo(() => {
     if (!content || content.trim().length === 0) return '';
     
     const trimmed = content.trim();
     
     // If content already starts with a heading, don't modify
     if (/^#{1,6}\s/.test(trimmed)) {
       return trimmed;
     }
     
     // If content starts with code block, list, or quote, don't modify
     if (/^```|^[-*+]\s|^>\s|^\d+\.\s/.test(trimmed)) {
       return trimmed;
     }
     
     // Split into lines to find first meaningful sentence
     const lines = trimmed.split('\n');
     const firstLine = lines[0].trim();
     
     // Check if first line looks like a question being answered or a topic introduction
     // Only auto-heading if it's short enough (under 100 chars) and looks like a title
     const isShortIntro = firstLine.length > 5 && firstLine.length < 100;
     const endsWithPunctuation = /[.!?:]$/.test(firstLine);
     const hasMultipleLines = lines.length > 1;
     const nextLineHasContent = lines[1] && lines[1].trim().length > 0;
     
     // Auto-heading logic: if first line is short, ends naturally, and has follow-up content
     if (isShortIntro && (endsWithPunctuation || !hasMultipleLines)) {
       // Check if this looks like a proper intro/title (not a code snippet or list item)
       const looksLikeTitle = !firstLine.startsWith('-') && 
                              !firstLine.startsWith('*') && 
                              !firstLine.startsWith('`') &&
                              !firstLine.match(/^\d+\./) &&
                              firstLine.length > 10 &&
                              hasMultipleLines &&
                              nextLineHasContent;
       
       if (looksLikeTitle) {
         // Convert first line to a heading
         const restOfContent = lines.slice(1).join('\n');
         return `## ${firstLine}\n\n${restOfContent}`;
       }
     }
     
     return trimmed;
   }, [content]);
 
   return (
     <>
       <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground">
         <ReactMarkdown
           remarkPlugins={[remarkGfm, remarkMath]}
           rehypePlugins={[rehypeKatex]}
           components={{
             h1: ({ children }) => (
               <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground leading-tight">{children}</h1>
             ),
             h2: ({ children }) => (
               <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground leading-snug">{children}</h2>
             ),
             h3: ({ children }) => (
               <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>
             ),
             h4: ({ children }) => (
               <h4 className="text-base font-semibold mt-3 mb-2 text-foreground">{children}</h4>
             ),
             p: ({ children }) => (
               <p className="mb-4 leading-7 text-foreground">{children}</p>
             ),
             ul: ({ children }) => (
               <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground marker:text-muted-foreground">{children}</ul>
             ),
             ol: ({ children }) => (
               <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground">{children}</ol>
             ),
             li: ({ children }) => (
               <li className="leading-7 pl-1">{children}</li>
             ),
             strong: ({ children }) => (
               <strong className="font-semibold text-foreground">{children}</strong>
             ),
             em: ({ children }) => (
               <em className="italic text-foreground">{children}</em>
             ),
             code: ({ inline, className, children, ...props }: any) => {
               const match = /language-(\w+)/.exec(className || '');
               const codeString = String(children).replace(/\n$/, '');
               
               if (!inline && match) {
                 return <CodeBlock code={codeString} language={match[1]} />;
               }
               
               // Inline code
               if (inline) {
                 return (
                   <code
                     className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                     {...props}
                   >
                     {children}
                   </code>
                 );
               }
               
               // Code block without language
               return <CodeBlock code={codeString} language="text" />;
             },
             pre: ({ children }) => {
               // Let the code component handle rendering
               return <>{children}</>;
             },
             a: ({ href, children }) => (
               <button
                 onClick={(e) => href && handleLinkClick(e, href)}
                 className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors"
               >
                 {children}
                 <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                 </svg>
               </button>
             ),
             blockquote: ({ children }) => (
               <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground bg-muted/30 py-2 rounded-r">
                 {children}
               </blockquote>
             ),
             table: ({ children }) => (
               <div className="overflow-x-auto my-4 rounded-lg border border-border">
                 <table className="min-w-full divide-y divide-border">
                   {children}
                 </table>
               </div>
             ),
             thead: ({ children }) => (
               <thead className="bg-muted">{children}</thead>
             ),
             th: ({ children }) => (
               <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                 {children}
               </th>
             ),
             td: ({ children }) => (
               <td className="px-4 py-3 text-sm border-t border-border">{children}</td>
             ),
             hr: () => (
               <hr className="my-6 border-border" />
             ),
             img: ({ src, alt }) => (
               <img
                 src={src}
                 alt={alt}
                 className="rounded-lg max-w-full h-auto my-4 shadow-md"
                 loading="lazy"
               />
             ),
           }}
         >
           {processedContent}
         </ReactMarkdown>
         
         {/* Streaming cursor */}
         {isStreaming && (
           <span className="inline-block w-2 h-5 bg-foreground/80 animate-pulse ml-0.5 align-middle rounded-sm" />
         )}
       </div>
 
       <LinkConfirmModal 
         isOpen={!!linkToOpen}
         onClose={() => setLinkToOpen(null)}
         url={linkToOpen || ''}
         onConfirm={confirmOpenLink}
       />
     </>
   );
 };