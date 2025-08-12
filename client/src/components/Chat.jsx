import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../utils/api';
import './Chat.css';

const Chat = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Sample construction-related prompts
  const samplePrompts = [
    "What are the safety requirements for roofing work?",
    "How do I calculate concrete quantities for a foundation?",
    "What's the best practice for electrical inspections?",
    "Tell me about OSHA fall protection requirements",
    "How should I organize project documentation?",
    "What are common causes of construction delays?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message on component mount
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: `Hello ${user?.firstName}! I'm your construction industry AI assistant. I can help you with safety protocols, project management, inspection guidelines, and construction best practices. What would you like to know?`,
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  }, [user]);

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/ai/chat', {
        message: messageText,
        context: {
          userRole: user?.role,
          userName: user?.firstName
        }
      });

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
        usage: response.data.usage
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: `Chat cleared! How can I help you with your construction projects, ${user?.firstName}?`,
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Tab */}
      <button 
        className={`chat-tab ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        aria-label="Toggle AI Chat"
      >
        🤖 AI CHAT
      </button>

      {/* Chat Panel */}
      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        
        {/* Chat Header */}
        <div className="chat-header">
          <h2 className="chat-title">🤖 AI Construction Assistant</h2>
          <button 
            className="chat-close"
            onClick={onToggle}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages Wrapper */}
        <div className="chat-messages-wrapper">
          
          {/* Sample Prompts */}
          {messages.length <= 1 && (
            <div className="sample-prompts">
              <h3>Try asking about:</h3>
              <div className="prompts-grid">
                {samplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="prompt-button"
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'} ${message.isError ? 'error-message' : ''}`}
              >
                <div className="message-content">
                  <div className="message-text">
                    {message.text}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                    {message.usage && (
                      <span className="usage-info">
                        • {message.usage.total_tokens} tokens
                      </span>
                    )}
                  </div>
                </div>
                <div className="message-avatar">
                  {message.sender === 'user' ? (
                    <span className="user-avatar">👤</span>
                  ) : (
                    <span className="ai-avatar">🤖</span>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message ai-message loading-message">
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
                <div className="message-avatar">
                  <span className="ai-avatar">🤖</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="chat-input-form">
            <div className="input-wrapper">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about construction safety, project management, inspections..."
                className="chat-input"
                rows="2"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  '🚀'
                )}
              </button>
            </div>
          </form>

          <div className="chat-actions">
            <button
              onClick={clearChat}
              className="btn btn-secondary btn-small"
              disabled={isLoading}
            >
              🗑️ Clear Chat
            </button>
            <span className="chat-info">
              Press Enter to send • Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
