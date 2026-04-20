import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatProps {
  onClose?: () => void;
}

export function AIChat({ onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'SVOS Assistant online. How can I help you navigate the venue today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real implementation this would fetch from /api/assistant
      // const res = await fetch('/api/assistant', { method: 'POST', body: JSON.stringify({ query: input, venueId }) });
      // const data = await res.json();

      // Simulating API call for this phase
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'I am analyzing crowd zones... The nearest washroom is at Gate 3 with a 2-minute wait time.',
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border sm:max-h-[600px] w-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-black text-white">
        <h2 className="font-bold uppercase tracking-widest text-xs">SVOS Assistant</h2>
        {onClose && (
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <span className="sr-only">Close chat</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 text-sm bg-[#f6f6f6] text-black border border-border flex items-center space-x-1">
              <div className="w-2 h-2 bg-black animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-black animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-black animate-bounce"></div>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3 bg-white flex">
        <label htmlFor="ai-input" className="sr-only">
          Type your query
        </label>
        <input
          id="ai-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SVOS Assistant..."
          className="flex-1 bg-transparent text-sm focus:outline-none p-2 border border-border focus:border-black transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="ml-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-widest uppercase disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
