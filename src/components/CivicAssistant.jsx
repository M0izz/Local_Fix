import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

function CivicAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am LocalAI, your predictive civic assistant. Ask me about neighborhood trends, most reported issues, or how to get involved!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const systemPrompt = `You are LocalAI, a helpful and predictive civic assistant for the Local Fix app. 
        Your goal is to help citizens understand their community data. Keep answers brief (1-3 sentences) and encouraging. 
        If asked for predictive insights, give a plausible forecast based on urban trends (e.g. "Based on recent weather, expect an increase in pothole reports next month. Pothole reports usually jump 15% after heavy rains.").
        User's message: ${userMessage}`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'assistant', text }]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I am having trouble connecting to the civic database right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          zIndex: 1000,
          border: 'none',
          cursor: 'pointer',
          animation: 'fadeIn 0.5s ease-out'
        }}
      >
        <Sparkles size={28} color="white" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="bento-card"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '350px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>LocalAI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '16px', 
                  backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                  border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  fontSize: '0.875rem'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)' }}>
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about local insights..." 
              className="input-field"
              style={{ margin: 0, padding: '0.75rem 1rem', flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 1rem', borderRadius: '12px' }} disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default CivicAssistant;
