import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useChatSocket = (sessionId, token) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);

  // Initialize and connect socket
  useEffect(() => {
    if (!token || !sessionId) return;

    // Connect to WebSocket with token in handshake auth
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    // Socket events
    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setError('Failed to connect to chat assistant. Please try again.');
    });

    // Confirmation that user's message was successfully saved and processed
    socket.on('chat:message_received', (userMsg) => {
      setMessages((prev) => [...prev, userMsg]);
    });

    // Handle incoming typing indicator
    socket.on('chat:typing', (data) => {
      setIsTyping(data.isTyping);
    });

    // Handle token streaming
    socket.on('chat:token', (data) => {
      setIsStreaming(true);
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        
        // If last message is from assistant, append token
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + data.token },
          ];
        } else {
          // Otherwise create a new assistant message placeholder
          return [
            ...prev,
            {
              _id: 'temp-assistant',
              role: 'assistant',
              content: data.token,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      });
    });

    // Handle completion of streaming response
    socket.on('chat:done', (assistantMsg) => {
      setIsStreaming(false);
      setIsTyping(false);
      setMessages((prev) => {
        // Remove the temporary assistant message and append the saved official DB message
        const filtered = prev.filter((msg) => msg._id !== 'temp-assistant');
        return [...filtered, assistantMsg];
      });
    });

    // Handle errors from server
    socket.on('chat:error', (data) => {
      console.error('[Socket] Server error:', data.message);
      setError(data.message);
      setIsStreaming(false);
      setIsTyping(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, token]);

  // Send message helper
  const sendMessage = useCallback((content) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Chat is currently disconnected. Retrying...');
      return;
    }
    setError(null);
    socketRef.current.emit('chat:message', { sessionId, content });
  }, [sessionId]);

  // Emits user typing event to the server
  const sendTypingState = useCallback((typingState) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:typing_client', { sessionId, isTyping: typingState });
    }
  }, [sessionId]);

  return {
    messages,
    setMessages,
    sendMessage,
    sendTypingState,
    isStreaming,
    isTyping,
    error,
  };
};
