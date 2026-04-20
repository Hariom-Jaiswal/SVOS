import { useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

/**
 * Custom hook to manage AI Assistant interactions.
 *
 * DESIGN DECISION: SEPARATION OF CONCERNS
 * By extracting this logic from the UI component, we make the chat logic
 * reusable and independently testable.
 */
export function useVenueAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'SVOS Assistant online. How can I help you navigate the venue today?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation:
      // const response = await fetch('/api/assistant', {
      //   method: 'POST',
      //   body: JSON.stringify({ query: text, context })
      // });
      // if (!response.ok) throw new Error('AI failed');
      // const data = await response.json();

      // Mocked for the final demo phase to ensure stability
      await new Promise((r) => setTimeout(r, 1000));

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'I am analyzing crowd zones... The nearest washroom is at Gate 3 with a 2-minute wait time.',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError('Failed to connect to SVOS Intelligence.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
