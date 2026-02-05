 import { useState, useCallback, useRef } from 'react';
 
 interface StreamChatOptions {
   onToken?: (token: string) => void;
   onComplete?: (fullResponse: string) => void;
   onError?: (error: Error) => void;
 }
 
 export const useStreamChat = () => {
   const [isStreaming, setIsStreaming] = useState(false);
   const abortControllerRef = useRef<AbortController | null>(null);
   const fullResponseRef = useRef('');
 
   const stopStreaming = useCallback(() => {
     if (abortControllerRef.current) {
       abortControllerRef.current.abort();
       abortControllerRef.current = null;
     }
     setIsStreaming(false);
   }, []);
 
   const streamChat = useCallback(async (
     messages: Array<{ role: string; content: string }>,
     conversationId: string | null,
     model: string,
     options: StreamChatOptions
   ) => {
     const controller = new AbortController();
     abortControllerRef.current = controller;
     setIsStreaming(true);
     fullResponseRef.current = '';
 
     try {
       const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
       
       const resp = await fetch(CHAT_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({ 
           messages, 
           conversationId, 
           model,
           stream: true 
         }),
         signal: controller.signal,
       });
 
       if (!resp.ok) {
         const errorData = await resp.json().catch(() => ({}));
         throw new Error(errorData.error || `Request failed with status ${resp.status}`);
       }
 
       if (!resp.body) {
         throw new Error('No response body');
       }
 
       const reader = resp.body.getReader();
       const decoder = new TextDecoder();
       let textBuffer = '';
       let streamDone = false;
 
       while (!streamDone) {
         const { done, value } = await reader.read();
         if (done) break;
         
         textBuffer += decoder.decode(value, { stream: true });
 
         // Process line-by-line as data arrives
         let newlineIndex: number;
         while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
           let line = textBuffer.slice(0, newlineIndex);
           textBuffer = textBuffer.slice(newlineIndex + 1);
 
           if (line.endsWith('\r')) line = line.slice(0, -1);
           if (line.startsWith(':') || line.trim() === '') continue;
           if (!line.startsWith('data: ')) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === '[DONE]') {
             streamDone = true;
             break;
           }
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content as string | undefined;
             if (content) {
               fullResponseRef.current += content;
               options.onToken?.(content);
             }
           } catch {
             // Incomplete JSON split across chunks: put it back and wait for more data
             textBuffer = line + '\n' + textBuffer;
             break;
           }
         }
       }
 
       // Final flush
       if (textBuffer.trim()) {
         for (let raw of textBuffer.split('\n')) {
           if (!raw) continue;
           if (raw.endsWith('\r')) raw = raw.slice(0, -1);
           if (raw.startsWith(':') || raw.trim() === '') continue;
           if (!raw.startsWith('data: ')) continue;
           const jsonStr = raw.slice(6).trim();
           if (jsonStr === '[DONE]') continue;
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content as string | undefined;
             if (content) {
               fullResponseRef.current += content;
               options.onToken?.(content);
             }
           } catch { /* ignore partial leftovers */ }
         }
       }
 
       options.onComplete?.(fullResponseRef.current);
     } catch (error: any) {
       if (error.name === 'AbortError') {
         // User cancelled - return partial response
         options.onComplete?.(fullResponseRef.current);
       } else {
         options.onError?.(error);
       }
     } finally {
       setIsStreaming(false);
       abortControllerRef.current = null;
     }
 
     return fullResponseRef.current;
   }, []);
 
   return { streamChat, stopStreaming, isStreaming };
 };