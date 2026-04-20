import React, { useState, useRef, useEffect } from 'react';
import { useVenueAssistant } from '@/hooks/useVenueAssistant';

interface AIChatProps {
  onClose?: () => void;
}

/**
 * AI Assistant Chat Interface
 *
 * FEATURES:
 * - Accessibility: aria-live, automated focus management, keyboard Esc support.
 * - Logic: Separated into useVenueAssistant hook.
 */
export function AIChat({ onClose }: AIChatProps) {
  const { messages, isLoading, sendMessage } = useVenueAssistant();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // DESIGN DECISION: ACCESSIBILITY (Focus Management)
  // Ensure the user can start typing immediately when chat opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // DESIGN DECISION: ACCESSIBILITY (Keyboard shortcuts)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const textToSubmit = input;
    setInput('');

    // Mock context for the hook demo
    await sendMessage(textToSubmit);
  };

  return (
    <div
      className="flex flex-col h-full bg-background border border-border sm:max-h-[600px] w-full"
      role="dialog"
      aria-labelledby="chat-title"
    >
      <div className="flex items-center justify-between p-4 border-b border-border bg-black text-white">
        <h2 id="chat-title" className="font-bold uppercase tracking-widest text-xs">
          SVOS Assistant
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close Assistant (Esc)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 text-sm ${m.role === 'user' ? 'bg-black text-white' : 'bg-[#f6f6f6] text-black border border-border'}`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start" aria-busy="true">
            <div className="max-w-[80%] p-3 text-sm bg-[#f6f6f6] text-black border border-border flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-black animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-black animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-black animate-bounce"></div>
              <span className="sr-only">SVOS Assistant is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3 bg-white flex">
        <label htmlFor="ai-input" className="sr-only">
          Chat Message
        </label>
        <input
          id="ai-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SVOS Assistant..."
          className="flex-1 bg-transparent text-sm focus:outline-none p-2 border border-border focus:border-black transition-colors"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="ml-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-widest uppercase disabled:opacity-50 hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-black"
        >
          Send
        </button>
      </form>
    </div>
  );
}
