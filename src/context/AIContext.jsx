import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Type, Hash, Edit3, Image as ImageIcon } from 'lucide-react';

export const AI_FUNCTIONS = [
  { id: 'caption', label: 'Generate Caption', icon: Type },
  { id: 'hashtags', label: 'Generate Hashtags', icon: Hash },
  { id: 'rewrite', label: 'Rewrite Content', icon: Edit3 },
  { id: 'image', label: 'AI Image Prompt', icon: ImageIcon },
];

const AIContext = createContext(null);

export const AIProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: 'Hello! I am your PRAM AI Assistant. How can I help you elevate your social media presence today?', options: AI_FUNCTIONS }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef(null);

  // Load chat history from backend
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ai_messages) {
            try {
              const parsed = JSON.parse(data.ai_messages);
              if (parsed && parsed.length > 0) {
                setMessages(parsed);
              }
            } catch (e) {
              console.error("Failed to parse DB messages", e);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      } finally {
        setIsInitialized(true);
      }
    };
    fetchChatHistory();
  }, []);

  // Save chat history to backend when it changes
  useEffect(() => {
    if (!isInitialized) return; // Don't save before loading
    const saveChatHistory = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ai_messages: JSON.stringify(messages) })
        });
      } catch (err) {
        console.error('Failed to save chat history to DB', err);
      }
    };
    saveChatHistory();
  }, [messages, isInitialized]);

  const stopAIRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const clearChat = () => {
    setMessages([
      { id: 1, type: 'ai', text: 'Hello! I am your PRAM AI Assistant. How can I help you elevate your social media presence today?', options: AI_FUNCTIONS }
    ]);
  };

  const sendAIRequest = async (userText) => {
    setIsTyping(true);
    const token = sessionStorage.getItem('token');

    if (!token) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: "You must be logged in to use the AI.",
        hasActions: false
      }]);
      setIsTyping(false);
      return;
    }

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: [{ role: 'user', content: userText }]
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API_KEY_MISSING');
        }
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiText = data.choices[0].message.content;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: aiText,
        hasActions: true
      }]);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('AI Request aborted');
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: "Request stopped by user.",
          hasActions: false
        }]);
      } else if (error.message === 'API_KEY_MISSING') {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: "Sorry, I couldn't process your request. Please configure a valid API Key in the Settings page.",
          hasActions: false
        }]);
      } else {
        console.error('OpenAI API Error:', error);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: "Sorry, I couldn't process your request due to an error.",
          hasActions: false
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (input) => {
    if (!input.trim()) return;
    const userText = input;
    const newUserMsg = { id: Date.now(), type: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    await sendAIRequest(userText);
  };

  const handleRegenerate = (msgIndex) => {
    let lastUserText = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        lastUserText = messages[i].text;
        break;
      }
    }
    if (lastUserText) {
      sendAIRequest(lastUserText);
    }
  };

  return (
    <AIContext.Provider value={{ messages, isTyping, handleSend, handleRegenerate, clearChat, stopAIRequest }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => useContext(AIContext);
